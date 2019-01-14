
exports.for_loc = {
    'de': { /* Source: https://de.wikipedia.org/wiki/ISO_3166-2:DE */
        /*
         * List of all states: bw by be bb hb hh he mv ni nw rp sl sn st sh th
         * https://nominatim.openstreetmap.org/reverse?format=json&lat=49.3836&lon=6.9389&zoom=18&addressdetails=1
         * It is easier to use: https://nominatim.openstreetmap.org/search?format=json&q=Berlin&zoom=18&addressdetails=1&limit=1
         * while read state short; do echo $short; curl "https://nominatim.openstreetmap.org/search?format=json&q=$state&zoom=18&addressdetails=1&limit=1"; echo; done  < list > list_states
         * and a bit of Vim magic:
         *      * :%s/^\[//
         *      * :%s/\]$//
         *
         * results in:
         * */
        'bw': {"place_id":"127592648","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"62611","boundingbox":["47.5324787","49.7913277","7.5117461","10.4955731"],"lat":"48.6296972","lon":"9.1949534","display_name":"Baden-Württemberg, Deutschland","class":"boundary","type":"administrative","importance":0.91594179054949,"icon":"https:\/\/nominatim.openstreetmap.org\/images\/mapicons\/poi_boundary_administrative.p.20.png","address":{"state":"Baden-Württemberg","country":"Deutschland","country_code":"de"}},
        'by': {"place_id":"127929545","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"2145268","boundingbox":["47.2701114","50.5647142","8.9763497","13.8396373"],"lat":"48.9467562","lon":"11.4038717","display_name":"Bayern, Deutschland","class":"boundary","type":"administrative","importance":0.86364921148205,"icon":"https:\/\/nominatim.openstreetmap.org\/images\/mapicons\/poi_boundary_administrative.p.20.png","address":{"state":"Bayern","country":"Deutschland","country_code":"de"}},
        'be': {"place_id":"2570600569","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"node","osm_id":"240109189","boundingbox":[52.3570365,52.6770365,13.2288599,13.5488599],"lat":"52.5170365","lon":"13.3888599","display_name":"Berlin, Deutschland","class":"place","type":"city","importance":0.92214979763087,"icon":"https:\/\/nominatim.openstreetmap.org\/images\/mapicons\/poi_place_city.p.20.png","address":{"city":"Berlin","state":"Berlin","country":"Deutschland","country_code":"de"}},
        'bb': {"place_id":"127637362","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"62504","boundingbox":["51.359064","53.5591194","11.2687203","14.7657479"],"lat":"52.8455492","lon":"13.2461296","display_name":"Brandenburg, Deutschland","class":"boundary","type":"administrative","importance":0.77909942030875,"icon":"https:\/\/nominatim.openstreetmap.org\/images\/mapicons\/poi_boundary_administrative.p.20.png","address":{"state":"Brandenburg","country":"Deutschland","country_code":"de"}},
        'hb': {"place_id":"127593591","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"62559","boundingbox":["53.0110367","53.5984187","8.4815929","8.9905816"],"lat":"53.0758196","lon":"8.8071646","display_name":"Bremen, Deutschland","class":"place","type":"city","importance":0.763036457778,"icon":"https:\/\/nominatim.openstreetmap.org\/images\/mapicons\/poi_place_city.p.20.png","address":{"city":"Bremen","county":"Bremen","state":"Bremen","country":"Deutschland","country_code":"de"}},
        'hh': {"place_id":"4992510","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"node","osm_id":"565666208","boundingbox":[50.9837641,56.1037641,7.4499133,12.5699133],"lat":"53.5437641","lon":"10.0099133","display_name":"Hamburg, Deutschland","class":"place","type":"state","importance":0.84914426014249,"icon":"https:\/\/nominatim.openstreetmap.org\/images\/mapicons\/poi_boundary_administrative.p.20.png","address":{"state":"Hamburg","country":"Deutschland","country_code":"de"}},
        'he': {"place_id":"127699835","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"62650","boundingbox":["49.3952611","51.657817","7.7724063","10.2364858"],"lat":"50.6118537","lon":"9.1909725","display_name":"Hessen, Deutschland, Europe","class":"boundary","type":"administrative","importance":0.7894576630047,"icon":"https:\/\/nominatim.openstreetmap.org\/images\/mapicons\/poi_boundary_administrative.p.20.png","address":{"state":"Hessen","country":"Deutschland","country_code":"de","continent":"Europe"}},
        'mv': {"place_id":"127614151","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"28322","boundingbox":["53.1098405","54.8849662","10.5938299","14.4125172"],"lat":"53.7735234","lon":"12.5755746","display_name":"Mecklenburg-Vorpommern, Deutschland","class":"boundary","type":"administrative","importance":0.84947984784608,"icon":"https:\/\/nominatim.openstreetmap.org\/images\/mapicons\/poi_boundary_administrative.p.20.png","address":{"state":"Mecklenburg-Vorpommern","country":"Deutschland","country_code":"de"}},
        'ni': {"place_id":"127329231","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"62771","boundingbox":["51.2924164","54.1387271","6.3460009","11.598118"],"lat":"52.6368397","lon":"9.8456838","display_name":"Niedersachsen, Deutschland","class":"boundary","type":"administrative","importance":0.76894109111985,"icon":"https:\/\/nominatim.openstreetmap.org\/images\/mapicons\/poi_boundary_administrative.p.20.png","address":{"state":"Niedersachsen","country":"Deutschland","country_code":"de"}},
        'nw': {"place_id":"127732320","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"62761","boundingbox":["50.322567","52.5314932","5.8663153","9.4617417"],"lat":"51.4785568","lon":"7.5533645","display_name":"Nordrhein-Westfalen, Deutschland","class":"boundary","type":"administrative","importance":0.88865826551398,"icon":"https:\/\/nominatim.openstreetmap.org\/images\/mapicons\/poi_boundary_administrative.p.20.png","address":{"state":"Nordrhein-Westfalen","country":"Deutschland","country_code":"de"}},
        'rp': {"place_id":"127735203","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"62341","boundingbox":["48.9664472","50.9423256","6.1122494","8.5083135"],"lat":"49.7497346","lon":"7.4396553","display_name":"Rheinland-Pfalz, Deutschland","class":"boundary","type":"administrative","importance":0.92600693281803,"icon":"https:\/\/nominatim.openstreetmap.org\/images\/mapicons\/poi_boundary_administrative.p.20.png","address":{"state":"Rheinland-Pfalz","country":"Deutschland","country_code":"de"}},
        'sl': {"place_id":"127646395","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"62372","boundingbox":["49.1119612","49.639427","6.3564834","7.4048307"],"lat":"49.4173988","lon":"6.9805789","display_name":"Saarland, Deutschland","class":"boundary","type":"administrative","importance":0.71690372570779,"icon":"https:\/\/nominatim.openstreetmap.org\/images\/mapicons\/poi_boundary_administrative.p.20.png","address":{"state":"Saarland","country":"Deutschland","country_code":"de"}},
        'sn': {"place_id":"127592262","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"62467","boundingbox":["50.1713247","51.6847554","11.872254","15.0419319"],"lat":"50.9295798","lon":"13.4585052","display_name":"Sachsen, Deutschland","class":"boundary","type":"administrative","importance":0.79373113008893,"icon":"https:\/\/nominatim.openstreetmap.org\/images\/mapicons\/poi_boundary_administrative.p.20.png","address":{"state":"Sachsen","country":"Deutschland","country_code":"de"}},
        'st': {"place_id":"127749736","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"62607","boundingbox":["50.9378508","53.0416917","10.5608128","13.1868819"],"lat":"51.908526","lon":"11.4939134","display_name":"Sachsen-Anhalt, Deutschland","class":"boundary","type":"administrative","importance":0.87575017594291,"icon":"https:\/\/nominatim.openstreetmap.org\/images\/mapicons\/poi_boundary_administrative.p.20.png","address":{"state":"Sachsen-Anhalt","country":"Deutschland","country_code":"de"}},
        'sh': {"place_id":"127640219","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"51529","boundingbox":["53.3598106","55.099161","7.5211615","11.672386"],"lat":"54.1853998","lon":"9.8220089","display_name":"Schleswig-Holstein, Deutschland","class":"boundary","type":"administrative","importance":0.89933973694716,"icon":"https:\/\/nominatim.openstreetmap.org\/images\/mapicons\/poi_boundary_administrative.p.20.png","address":{"state":"Schleswig-Holstein","country":"Deutschland","country_code":"de"}},
        'th': {"place_id":"127635502","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"62366","boundingbox":["50.2043467","51.6489423","9.8767193","12.6539178"],"lat":"50.7333163","lon":"11.0747905","display_name":"Thüringen, Deutschland, Europe","class":"boundary","type":"administrative","importance":0.79508440692478,"icon":"https:\/\/nominatim.openstreetmap.org\/images\/mapicons\/poi_boundary_administrative.p.20.png","address":{"state":"Thüringen","country":"Deutschland","country_code":"de","continent":"Europe"}},

        // I started by doing this manually … Just don‘t :)
        // 'sl': {"place_id":"16283403","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"node","osm_id":"1552520448","lat":"49.3905678","lon":"6.9250357","display_name":"Landsweiler, Lebach, Landkreis Saarlouis, Saarland, 66822, Deutschland","address":{"suburb":"Landsweiler","town":"Lebach","county":"Landkreis Saarlouis","state":"Saarland","postcode":"66822","country":"Deutschland","country_code":"de"}},
        // 'bw': {"place_id":"44651229","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"36248375","lat":"49.5400039","lon":"9.7937133","display_name":"K 2847, Lauda-K\u00f6nigshofen, Main-Tauber-Kreis, Regierungsbezirk Stuttgart, Baden-W\u00fcrttemberg, Germany, European Union","address":{"road":"K 2847","city":"Lauda-K\u00f6nigshofen","county":"Main-Tauber-Kreis","state_district":"Regierungsbezirk Stuttgart","state":"Baden-W\u00fcrttemberg","country":"Germany","country_code":"de","continent":"European Union"} },
        // 'by': {"place_id":"84131573","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"126502887","lat":"48.13646775","lon":"11.5059719288306","display_name":"7, Heigenmooserstraße, Bezirksteil St. Ulrich, Stadtbezirk 25 Laim, München, Oberbayern, Bayern, 80686, Deutschland","address":{"house_number":"7","road":"Heigenmooserstraße","suburb":"Bezirksteil St. Ulrich","city_district":"Stadtbezirk 25 Laim","city":"München","state_district":"Oberbayern","state":"Bayern","postcode":"80686","country":"Deutschland","country_code":"de"}},
        // 'be': {"place_id":"2570600569","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"node","osm_id":"240109189","boundingbox":[52.3570365,52.6770365,13.2288599,13.5488599],"lat":"52.5170365","lon":"13.3888599","display_name":"Berlin, Deutschland","class":"place","type":"city","importance":0.93214979763087,"icon":"https:\/\/nominatim.openstreetmap.org\/images\/mapicons\/poi_place_city.p.20.png","address":{"city":"Berlin","state":"Berlin","country":"Deutschland","country_code":"de"}},
        // 'bb': {"place_id":"127637362","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"62504","boundingbox":["51.359064","53.5591194","11.2687203","14.7657479"],"lat":"52.8455492","lon":"13.2461296","display_name":"Brandenburg, Deutschland","class":"boundary","type":"administrative","importance":0.78909942030875,"icon":"https:\/\/nominatim.openstreetmap.org\/images\/mapicons\/poi_boundary_administrative.p.20.png","address":{"state":"Brandenburg","country":"Deutschland","country_code":"de"}},
        // 'hb': {"place_id":"127593591","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"62559","boundingbox":["53.0110367","53.5984187","8.4815929","8.9905816"],"lat":"53.0758196","lon":"8.8071646","display_name":"Bremen, Deutschland","class":"place","type":"city","importance":0.773036457778,"icon":"https:\/\/nominatim.openstreetmap.org\/images\/mapicons\/poi_place_city.p.20.png","address":{"city":"Bremen","county":"Bremen","state":"Bremen","country":"Deutschland","country_code":"de"}},
    },
    'dk' : {
        'dk': {"place_id":"127691068","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"50046","boundingbox":["54.4516667","57.9524297","7.7153255","15.5530641"],"lat":"55.670249","lon":"10.3333283","display_name":"Denmark","class":"boundary","type":"administrative","importance":0.94221531286648,"icon":"https:\/\/nominatim.openstreetmap.org\/images\/mapicons\/poi_boundary_administrative.p.20.png","address":{"country":"Denmark","country_code":"dk"}}
    },
    'ro' : { /* https://nominatim.openstreetmap.org/search?format=json&q=Romania&zoom=18&addressdetails=1&limit=1 */
        'ro' : {"place_id":"127691986","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"90689","boundingbox":["43.618682","48.2653964","20.2619773","30.0454257"],"lat":"45.9852129","lon":"24.6859225","display_name":"România","class":"boundary","type":"administrative","importance":0.83930940399775,"icon":"https:\/\/nominatim.openstreetmap.org\/images\/mapicons\/poi_boundary_administrative.p.20.png","address":{"country":"România","country_code":"ro"}}
    },
    'se': {
        '_se': {
            "_url": "https://nominatim.openstreetmap.org/reverse?format=json&lat=63.1151&lon=16.5767&zoom=18&addressdetails=1&accept-language=en",
            "place_id": "144718067",
            "licence": "Data © OpenStreetMap contributors, ODbL 1.0. https://www.openstreetmap.org/copyright",
            "osm_type": "relation",
            "osm_id": "935558",
            "lat": "63.167997",
            "lon": "15.965908816134",
            "display_name": "Ragunda, Jämtlands län, Norrland, Sweden",
            "address": {
                "county": "Ragunda",
                "state": "Jämtlands län",
                "country": "Sweden",
                "country_code": "se"
            },
            "boundingbox": [
                "62.8082014",
                "63.5218885",
                "15.2350864",
                "16.9987048"
            ]
        },
    },
    'br': {
        '_br': {
            "_url": "https://nominatim.openstreetmap.org/reverse?format=json&lat=-10&lon=-52&zoom=18&addressdetails=1&accept-language=en",
            "place_id": "116000235",
            "licence": "Data © OpenStreetMap contributors, ODbL 1.0. https://www.openstreetmap.org/copyright",
            "osm_type": "way",
            "osm_id": "242268712",
            "lat": "-10.1425809",
            "lon": "-51.9179115",
            "display_name": "MT-430, Confresa, Microrregião do Norte Araguaia, Mesorregião Nordeste de Mato-Grosso, Mato Grosso, Central-West Region, Brazil",
            "address": {
                "road": "MT-430",
                "town": "Confresa",
                "county": "Microrregião do Norte Araguaia",
                "state_district": "Mesorregião Nordeste de Mato-Grosso",
                "state": "Mato Grosso",
                "country": "Brazil",
                "country_code": "br"
            },
            "boundingbox": [
                "-10.4276788",
                "-9.9747152",
                "-52.0892082",
                "-51.8810199"
            ]
        },
    },
    'hu': {
        '_hu': {
            "_url": "https://nominatim.openstreetmap.org/reverse?format=json&lat=47.4821&lon=19.0640&zoom=18&addressdetails=1&accept-language=en",
            "place_id": "76509191",
            "licence": "Data © OpenStreetMap contributors, ODbL 1.0. https://www.openstreetmap.org/copyright",
            "osm_type": "way",
            "osm_id": "67327954",
            "lat": "47.48146955",
            "lon": "19.0639924870181",
            "display_name": "Nehru part, Közraktár utca, Belső-Ferencváros, 9th district, Budapest, Central Hungary, Közép-Magyarország, 1092, Hungary",
            "address": {
                "park": "Nehru part",
                "road": "Közraktár utca",
                "suburb": "Belső-Ferencváros",
                "city_district": "9th district",
                "city": "Budapest",
                "region": "Közép-Magyarország",
                "postcode": "1092",
                "country": "Hungary",
                "country_code": "hu"
            },
            "boundingbox": [
                "47.4799813",
                "47.4829177",
                "19.0619122",
                    "19.0657089"
            ],
        },
    },
    'sk' : { /* https://nominatim.openstreetmap.org/search?format=json&q=Slovakia&zoom=18&addressdetails=1&limit=1 */
        'sk' : {"place_id":"158550995","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright","osm_type":"relation","osm_id":"14296","boundingbox":["47.7314286","49.6138162","16.8331891","22.56571"],"lat":"48.7411522","lon":"19.4528646","display_name":"Slovensko","class":"boundary","type":"administrative","importance":0.79910907103218,"icon":"https:\/\/nominatim.openstreetmap.org\/images\/mapicons\/poi_boundary_administrative.p.20.png","address":{"country":"Slovensko","country_code":"sk"}}
    }
};
