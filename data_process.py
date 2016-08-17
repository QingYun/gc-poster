import sys, getopt
import os
import json
import csv

COUNTRY_CODE_FILE = "WDI_Country.csv"
DATA_FILE = "WDI_Data.csv"
OLYMPIC_FILE = "Summer Olympic medallists 1896 to 2008 - ALL MEDALISTS.csv"
INDICATORS = {
    "SP.POP.TOTL": "population",
    "SE.PRM.TENR": "primary_school_enrolment_rate"
}

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

def getMedalTable(file, country_list):
    with open(file, "rb") as csvfile:
        content = csv.reader(csvfile)
        content.next()

        recorded = set()
        for row in content:
            if int(row[1]) < 1992: continue
            if row[5] not in country_list: continue
            recorded.add((row[1], row[2], row[3], row[5], row[6], row[7], row[8]))

        table = {}
        for y in xrange(1992, 2009, 4):
            table[y] = {}
            for c in country_list:
                table[y][c] = 0
        for (y, _, _, cc, _, _, _) in recorded:
            table[int(y)][cc] = table[int(y)][cc] + 1
        return table

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
        "1992": "y1992",
        "1996": "y1996",
        "2000": "y2000",
        "2004": "y2004",
        "2008": "y2008",
        "2012": "y2012"
    }
    def takeYears(d):
        toFloat = lambda k: float(d[k]) if d[k] != "" else None
        return map(toFloat, ["y{}".format(year) for year in xrange(1992, 2012 + 1, 4)])
    def addToJSON(columns):
        json_dict[columns["cc"]].update({
            INDICATORS[columns["ic"]]: takeYears(columns)
        })
    filterCSV(os.path.join(data_folder, DATA_FILE), filter_conditions, columns_wanted, addToJSON)

    # table = getMedalTable(os.path.join(data_folder, OLYMPIC_FILE), json_dict.keys())
    # print table
    # for cc in json_dict.keys():
    #     medals = []
    #     for year in xrange(1992, 2009, 4):
    #         result = table[year][cc]
    #         medals.append(result if result else 0)
    #     json_dict[cc]["medals"] = medals

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
