import sys, getopt
import os
import json
import csv
import requests
import lxml.html

COUNTRY_CODE_FILE = "WDI_Country.csv"
DATA_FILE = "WDI_Data.csv"
INDICATORS = {
    "SP.POP.TOTL": "population",
    "SE.PRM.TENR": "primary_school_enrolment_rate",
    "NY.GDP.PCAP.CD": "GDP_per_capita"
}

def years():
    return map(str, xrange(1992, 2013, 4))

def getJSON(file):
    with open(file) as content:
        return json.load(content)

def writeJSON(file, json_dict):
    with open(file, "w") as output:
        json.dump(json_dict, output, indent = 2)

def lookUpCSV(file, key_col, value_col):
    with open(file, "rb") as csvfile:
        content = csv.reader(csvfile)

        header = content.next()
        key_index = header.index(key_col)
        value_index = header.index(value_col)

        d = {}
        for row in content:
            d[row[key_index]] = row[value_index]

        return lambda k: d[k]

def fillCountryName(json_dict, file):
    lookUp = lookUpCSV(file, "Country Code", "Short Name")
    for k in json_dict:
        json_dict[k]["country_name"] = lookUp(k)
    return json_dict

def filterCSV(file, conditions, wanted, cb):
    with open(file, "rb") as csvfile:
        content = csv.reader(csvfile)
        header = content.next()

        index_conditions = {}
        for col_name, test in conditions.iteritems():
            index_conditions[header.index(col_name)] = test

        index_wanted = {}
        for col_name, display_name in wanted.iteritems():
            index_wanted[header.index(col_name)] = display_name

        for row in content:
            needed = True

            for col_index, test in index_conditions.iteritems():
                if row[col_index] not in test:
                    needed = False
                    break

            if needed:
                data_wanted = {}
                for col_index, display_name in index_wanted.iteritems():
                    data_wanted[display_name] = row[col_index]
                cb(data_wanted)

def getMedalTable(NOC_map):
    def parseMedalCount(row):
        cc = row.cssselect("span")[-1].text[1:-1]
        count = int(row.cssselect("td")[-1].text)
        return [cc, count]

    title_parts = ["Summer", "Olympics", "medal", "table"];
    medal_table = {}

    country_code_map_url = "https://en.wikipedia.org/wiki/Comparison_of_IOC,_FIFA,_and_ISO_3166_country_codes"
    country_code_map_req = requests.get(country_code_map_url)
    country_code_map = {}
    def getCountryCode(code):
        if len(country_code_map) == 0:
            dom_tree = lxml.html.fromstring(country_code_map_req.text)
            table = dom_tree.cssselect("table.wikitable")[0]
            for row in table.cssselect("tr")[1:]:
                tds = row.cssselect("td")
                [IOC, ISO] = [tds[2].text, tds[4].text]
                if IOC == None or IOC == ISO: continue
                country_code_map.update({IOC: ISO})
            print country_code_map

        return country_code_map.get(code, code)

    req_table = {}
    for year in years():
        url = "https://en.wikipedia.org/wiki/" + "_".join([year] + title_parts)
        req_table[year] = requests.get(url)

    for year in years():
        medal_table[year] = {}
        dom_tree = lxml.html.fromstring(req_table[year].text)
        tables = dom_tree.cssselect("table.wikitable")

        def takeMainTable(elm):
            captions = elm.cssselect("caption")
            return len(captions) > 0 and captions[0].text == " ".join([year] + title_parts)
        [main_table] = filter(takeMainTable, tables)

        for row in main_table.cssselect("tr")[1:-1]:
            [cc, count] = parseMedalCount(row)
            medal_table[year][getCountryCode(cc)] = count

    return medal_table

def parse(target_file, data_folder):
    print "filling data into [{}] ...".format(target_file)

    json_dict = fillCountryName(getJSON(target_file), os.path.join(data_folder, COUNTRY_CODE_FILE))

    filter_conditions = {
        "Country Code": json_dict.keys(),
        "Indicator Code": INDICATORS.keys()
    }
    columns_wanted = {
        "Country Code": "cc",
        "Indicator Code": "ic",
    }
    columns_wanted.update({y: "y" + y for y in years()})
    def takeYears(d):
        toFloat = lambda k: float(d[k]) if d[k] != "" else None
        return map(toFloat, ["y{}".format(year) for year in years()])
    def addToJSON(columns):
        json_dict[columns["cc"]].update({
            INDICATORS[columns["ic"]]: takeYears(columns)
        })
    filterCSV(os.path.join(data_folder, DATA_FILE), filter_conditions, columns_wanted, addToJSON)

    table = getMedalTable({})
    for cc in json_dict.keys():
        medals = []
        for year in years():
            if cc not in table[year]:
                print "Missing country [{}] in [{}]".format(cc, year)
            medals.append(table[year].get(cc, 0))
        json_dict[cc]["medals"] = medals

    writeJSON(target_file, json_dict)

    print "finish!"

def main(argv):
    target_file = ""
    data_folder = ""
    try:
        opts, args = getopt.getopt(argv,"ht:d:",["target=", "data-folder="])
    except getopt.GetoptError:
        print "data_process.py -t <target json file> -d <data folder>"
        sys.exit(2)
    for opt, arg in opts:
        if opt == "-h":
            print "data_process.py -t <target json file> -d <data folder>"
            sys.exit()
        elif opt in ("-t", "--target"):
            target_file = arg
        elif opt in ("-d", "--data-folder"):
            data_folder = arg

    parse(target_file, data_folder)

if __name__ == "__main__":
    main(sys.argv[1:])
