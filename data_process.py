# -*- coding: utf-8 -*-
import sys, getopt
import os
import json
import csv
import requests
import lxml.html

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

def getCountryCodeDict(alias):
    url = "https://en.wikipedia.org/wiki/Comparison_of_IOC,_FIFA,_and_ISO_3166_country_codes"
    req = requests.get(url)
    IOC_ISO_dict = {}
    ISO_country_dict = {}
    country_ISO_dict = {}
    dom_tree = lxml.html.fromstring(req.text)
    table = dom_tree.cssselect("table.wikitable")[0]
    for row in table.cssselect("tr")[1:]:
        tds = row.cssselect("td")
        [country, IOC, ISO] = [tds[1].cssselect("a")[0].text] + map(lambda i: tds[i].text, [2, 4])
        country = alias.get(country, country)
        IOC_ISO_dict.update({IOC: ISO})
        ISO_country_dict.update({ISO: country})
        country_ISO_dict.update({country: ISO})

    return [ISO_country_dict, IOC_ISO_dict, country_ISO_dict]

def fillCountryName(json_dict, ISO_country_dict):
    for k in json_dict:
        json_dict[k]["country_name"] = ISO_country_dict.get(k)
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

def getMedalTable(IOC_ISO_dict):
    def parseMedalCount(row):
        cc = row.cssselect("span")[-1].text[1:-1]
        count = int(row.cssselect("td")[-1].text)
        return [cc, count]

    title_parts = ["Summer", "Olympics", "medal", "table"];
    medal_table = {}

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
            medal_table[year][IOC_ISO_dict.get(cc, cc)] = count

    return medal_table

def fillMedalCount(json_dict, medal_table):
    for cc in json_dict.keys():
        medals = []
        for year in years():
            if cc not in medal_table[year]:
                print "Missing country [{}] in [{}]".format(cc, year)
            medals.append(medal_table[year].get(cc, 0))
        json_dict[cc]["medals"] = medals

    return json_dict

def getRadioReceiverTable(country_ISO_dict):
    url = "http://www.nationmaster.com/country-info/stats/Media/Radio-receivers-per-1000"
    dom_tree = lxml.html.fromstring(requests.get(url).text)
    table_elm = dom_tree.cssselect(".table-main")[0]
    radio_receiver_table = {}
    for row in table_elm.cssselect("tbody tr"):
        country = row.cssselect("td")[1].text_content().strip()
        if country not in country_ISO_dict:
            print "Missing country [{}] in country_ISO_dict".format(country)
            continue

        data_str = row.cssselect("span.spark")[0].get("values")
        data_dict = {}
        for [year, data] in map(lambda s: s.split(":"), data_str.split(",")):
            data_dict[year] = float(data)

        data_list = []
        for year in years():
            data_list.append(data_dict.get(year, None))

        radio_receiver_table[country_ISO_dict.get(country)] = data_list

    return radio_receiver_table

def fillRadioReceiver(json_dict, radio_receiver_table):
    for cc in json_dict.keys():
        if cc not in radio_receiver_table:
            print "Missing country [{}] in radio_receiver_table".format(cc)
        json_dict[cc]["radio_receivers_per_1000"] = radio_receiver_table.get(cc, [None] * len(years()))

    return json_dict

def parse(target_file, data_folder):
    print "filling data into [{}] ...".format(target_file)

    [ISO_country_dict, IOC_ISO_dict, country_ISO_dict] = getCountryCodeDict({
        "Korea, Republic of (South)": "South Korea",
        "Korea, Democratic People's Rep. (North)": "North Korea",
        "China, People's Republic of": "China",
        "Russian Federation": "Russia",
        u"São Tomé and Príncipe": "Sao Tome and Principe",
        u"Côte d'Ivoire": "Cote d'Ivoire",
        "Timor-Leste": "East Timor",
        "Congo, Democratic Republic of the": "Democratic Republic of the Congo"
    })
    json_dict = fillCountryName(getJSON(target_file), ISO_country_dict)

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

    medal_table = getMedalTable(IOC_ISO_dict)
    json_dict = fillMedalCount(json_dict, medal_table)

    radio_receiver_table = getRadioReceiverTable(country_ISO_dict)
    json_dict = fillRadioReceiver(json_dict, radio_receiver_table)

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
