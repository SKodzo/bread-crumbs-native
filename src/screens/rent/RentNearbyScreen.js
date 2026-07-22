import { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { useTheme } from "../../lib/theme";
import { fmt } from "../../lib/math";
import { ZIP_DB } from "../../lib/data";
import ZCTA_NAMES from "../../lib/zctaNames";
import { Card, SecTitle, SliderRow, NavButtons } from "../../components/UI";

// Resolve a ZIP's city name, handling ZCTA placeholder strings.
function resolveCity(zip, city, county, state) {
  if (!city || city.startsWith("Zcta") || city.startsWith("ZCTA")) {
    if (zip && ZCTA_NAMES[zip]) return ZCTA_NAMES[zip];
    return county ? county + " County" : state || "Your area";
  }
  if (/^\d/.test(city)) return county ? county + " County" : state || "Your area";
  return city;
}

// ZIP-zone lookup for major metros.
// Each zone covers a ZIP range and lists the nearest neighborhoods for users in that range.
// This means a user in Katy (77084) gets Energy Corridor/Memorial, not Downtown/Heights.
const METRO_ZIP_ZONES = {
  Houston: [
    { from: 77001, to: 77019, hoods: ['Downtown','Midtown','EaDo','Fourth Ward','Neartown','Midtown Arts District','Museum District Corridor','Riverside Terrace','MacGregor','Binz'] },
    { from: 77020, to: 77050, hoods: ['The Heights','Timbergrove','Oak Forest','Garden Oaks','Lindale Park','Northside','Independence Heights','Acres Homes','Greater Fifth Ward','Kashmere Gardens'] },
    { from: 77051, to: 77079, hoods: ['Montrose','River Oaks','Upper Kirby','Greenway Plaza','Galleria/Uptown','Bellaire','West University','Meyerland','Briargrove','Westheimer Corridor'] },
    { from: 77080, to: 77099, hoods: ['Energy Corridor','Memorial','Katy','Bear Creek','Copperfield','Cinco Ranch','Jersey Village','Spring Branch','Westchase','Eldridge/West Oaks'] },
    { from: 77200, to: 77599, hoods: ['Sugar Land','Pearland','The Woodlands','Friendswood','Missouri City','Stafford','Humble','Pasadena','League City','Conroe'] },
  ],
  'New York': [
    { from: 10001, to: 10040, hoods: ['Chelsea','Hell\'s Kitchen','Upper West Side','Morningside Heights','Harlem','Washington Heights','Inwood','Hamilton Heights','Manhattanville','Hudson Heights'] },
    { from: 10041, to: 10282, hoods: ['SoHo','Tribeca','Financial District','Battery Park City','Greenwich Village','NoLIta','East Village','Lower East Side','Two Bridges','Chinatown'] },
    { from: 11001, to: 11109, hoods: ['Astoria','Long Island City','Sunnyside','Woodside','Jackson Heights','Flushing','Forest Hills','Rego Park','Jamaica','Bayside'] },
    { from: 11200, to: 11239, hoods: ['Park Slope','Williamsburg','Bushwick','Crown Heights','Bed-Stuy','Flatbush','Bay Ridge','Sunset Park','Greenpoint','Carroll Gardens'] },
    { from: 10301, to: 10799, hoods: ['Jersey City','Hoboken','Weehawken','Union City','North Bergen','Bayonne','Bronx South','Bronx North','Yonkers','Mount Vernon'] },
  ],
  'Los Angeles': [
    { from: 90001, to: 90029, hoods: ['Silver Lake','Echo Park','Los Feliz','East Hollywood','Koreatown','Mid-City','Pico-Union','Historic Filipinotown','Rampart Village','MacArthur Park'] },
    { from: 90030, to: 90069, hoods: ['West Hollywood','Beverly Grove','Fairfax','Mid-Wilshire','Brentwood','Westwood','Palms','Mar Vista','Culver City','Century City'] },
    { from: 90230, to: 90403, hoods: ['Santa Monica','Venice','Marina del Rey','Playa Vista','El Segundo','Manhattan Beach','Hermosa Beach','Redondo Beach','Inglewood','Hawthorne'] },
    { from: 90601, to: 91010, hoods: ['Pasadena','Arcadia','Monrovia','Alhambra','San Gabriel','Temple City','East LA','Monterey Park','El Monte','Whittier'] },
  ],
  Chicago: [
    { from: 60601, to: 60614, hoods: ['Lincoln Park','Lakeview','River North','Gold Coast','Streeterville','Old Town','Wicker Park','Bucktown','Logan Square','Roscoe Village'] },
    { from: 60615, to: 60630, hoods: ['Hyde Park','Kenwood','Pilsen','Bridgeport','Chinatown','South Loop','Bronzeville','Woodlawn','South Shore','Douglas'] },
    { from: 60631, to: 60659, hoods: ['Rogers Park','Edgewater','Uptown','Ravenswood','Andersonville','Irving Park','Albany Park','Jefferson Park','Norwood Park','Forest Glen'] },
    { from: 60660, to: 60827, hoods: ['Oak Park','Berwyn','Cicero','Melrose Park','Elmwood Park','Forest Park','Maywood','Bellwood','Westchester','Hillside'] },
  ],
  Dallas: [
    { from: 75201, to: 75219, hoods: ['Uptown','Deep Ellum','Knox/Henderson','Oak Lawn','Lower Greenville','M Streets','Lakewood','East Dallas','Junius Heights','Swiss Avenue'] },
    { from: 75220, to: 75249, hoods: ['Bishop Arts','Oak Cliff','Preston Hollow','Lake Highlands','White Rock','Lovers Lane','Inwood','Forest Hills','Casa Linda','Buckner Terrace'] },
    { from: 75250, to: 75287, hoods: ['Plano','Richardson','Garland','Mesquite','Rowlett','Allen','McKinney','Frisco','Sachse','Murphy'] },
    { from: 76000, to: 76299, hoods: ['Irving','Grand Prairie','Arlington','Euless','Bedford','Hurst','North Richland Hills','Keller','Southlake','Grapevine'] },
  ],
  Phoenix: [
    { from: 85001, to: 85042, hoods: ['Midtown Phoenix','Downtown Phoenix','Encanto','Melrose','Coronado','Camelback East','Central City','South Mountain','Laveen','South Phoenix'] },
    { from: 85043, to: 85099, hoods: ['Tempe','Chandler','Gilbert','Mesa','Ahwatukee','Goodyear','Avondale','Tolleson','Surprise West','Glendale South'] },
    { from: 85201, to: 85399, hoods: ['Old Town Scottsdale','North Scottsdale','Arcadia','Biltmore','Paradise Valley','Cave Creek','Fountain Hills','Glendale','Peoria','Surprise'] },
  ],
  Miami: [
    { from: 33101, to: 33139, hoods: ['Brickell','Wynwood','Design District','Little Havana','Coral Gables','Coconut Grove','South Beach','Mid-Beach','Edgewater','Overtown'] },
    { from: 33140, to: 33199, hoods: ['North Miami','North Miami Beach','Aventura','Hialeah','Opa-locka','Kendall','Doral','Sweetwater','Miami Lakes','Medley'] },
    { from: 33301, to: 33499, hoods: ['Fort Lauderdale','Hollywood','Hallandale Beach','Pembroke Pines','Miramar','Davie','Weston','Plantation','Sunrise','Lauderhill'] },
  ],
  Atlanta: [
    { from: 30301, to: 30316, hoods: ['Old Fourth Ward','Inman Park','Candler Park','Little Five Points','Grant Park','East Atlanta','Reynoldstown','Kirkwood','Edgewood','Ormewood Park'] },
    { from: 30317, to: 30350, hoods: ['Buckhead','Virginia-Highland','Morningside','Druid Hills','Brookhaven','Dunwoody','Sandy Springs','Midtown','West End','Cascade'] },
    { from: 30060, to: 30099, hoods: ['Smyrna','Marietta','Kennesaw','Acworth','Woodstock','Alpharetta','Roswell','Johns Creek','Lawrenceville','Norcross'] },
  ],
  'San Francisco': [
    { from: 94101, to: 94112, hoods: ['Mission District','Castro','Noe Valley','Potrero Hill','Bernal Heights','Dogpatch','Glen Park','Excelsior','Outer Mission','Visitacion Valley'] },
    { from: 94113, to: 94134, hoods: ['Hayes Valley','Lower Haight','NoPa','Western Addition','Inner Richmond','Outer Richmond','Inner Sunset','Outer Sunset','Parkside','Forest Hill'] },
    { from: 94501, to: 94610, hoods: ['Oakland Grand Lake','Temescal','Rockridge','Piedmont Ave','Montclair','Fruitvale','East Oakland','Berkeley','Albany','El Cerrito'] },
  ],
  Seattle: [
    { from: 98101, to: 98119, hoods: ['Capitol Hill','First Hill','Central District','Belltown','South Lake Union','Queen Anne','Magnolia','Pioneer Square','International District','Minor'] },
    { from: 98120, to: 98145, hoods: ['Beacon Hill','Columbia City','Rainier Valley','Seward Park','Mount Baker','Othello','Georgetown','SoDo','West Seattle','White Center'] },
    { from: 98146, to: 98199, hoods: ['Ballard','Fremont','Phinney Ridge','Greenwood','Crown Hill','Northgate','Lake City','Wedgwood','View Ridge','Sand Point'] },
  ],
  Denver: [
    { from: 80201, to: 80220, hoods: ['LoHi','RiNo','Five Points','Curtis Park','Cole','Whittier','Skyland','City Park West','Congress Park','Cheesman Park'] },
    { from: 80221, to: 80250, hoods: ['Wash Park','Baker','South Broadway','Platt Park','Virginia Village','Cherry Creek','Glendale','University Hills','Hampden','Wellshire'] },
    { from: 80002, to: 80030, hoods: ['Highlands','Berkeley','Sloan\'s Lake','Edgewater','Arvada','Wheat Ridge','Lakewood','Golden','Applewood','Littleton'] },
  ],
  Austin: [
    { from: 78701, to: 78718, hoods: ['East Austin','South Congress','Bouldin Creek','Travis Heights','Cherrywood','Holly','Mueller','Windsor Park','North Loop','Crestview'] },
    { from: 78719, to: 78739, hoods: ['South Lamar','Barton Hills','Oak Hill','Slaughter Creek','Manchaca','Westgate','Travis Country','Circle C','Shady Hollow','Menchaca'] },
    { from: 78740, to: 78799, hoods: ['Cedar Park','Round Rock','Pflugerville','Georgetown','Leander','Manor','Del Valle','Kyle','Buda','Lakeway'] },
  ],
  'San Antonio': [
    { from: 78201, to: 78234, hoods: ['King William','Southtown','Tobin Hill','Monte Vista','Alamo Heights','Pearl District','Government Hill','Mahncke Park','Olmos Park','Terrell Hills'] },
    { from: 78235, to: 78299, hoods: ['Stone Oak','Leon Valley','Helotes','Converse','Universal City','Live Oak','Schertz','Boerne','New Braunfels','Windcrest'] },
  ],
  Nashville: [
    { from: 37201, to: 37216, hoods: ['East Nashville','Germantown','The Nations','Sylvan Park','Wedgewood-Houston','Hillsboro Village','Berry Hill','Inglewood','Madison','Donelson'] },
    { from: 37217, to: 37250, hoods: ['Green Hills','Bellevue','Antioch','Brentwood','Franklin','Smyrna','Murfreesboro','Hendersonville','Mount Juliet','Spring Hill'] },
  ],
  Charlotte: [
    { from: 28201, to: 28220, hoods: ['NoDa','Plaza Midwood','South End','Dilworth','Myers Park','Elizabeth','Belmont','Camp North End','Villa Heights','Optimist Park'] },
    { from: 28221, to: 28299, hoods: ['Ballantyne','Steele Creek','University City','Huntersville','Mooresville','Concord','Kannapolis','Matthews','Mint Hill','Gastonia'] },
  ],
  Raleigh: [
    { from: 27601, to: 27616, hoods: ['Glenwood South','Five Points','Person Street','Oakwood','Mordecai','East Village','Boylan Heights','Cameron Village','Brier Creek','North Hills'] },
    { from: 27617, to: 27699, hoods: ['Cary','Apex','Holly Springs','Fuquay-Varina','Morrisville','Durham','Chapel Hill','Garner','Knightdale','Wake Forest'] },
  ],
  Portland: [
    { from: 97201, to: 97219, hoods: ['Pearl District','NW District','Alberta Arts','Mississippi Ave','Hawthorne','Division','Belmont','Sellwood','Woodstock','St. Johns'] },
    { from: 97220, to: 97299, hoods: ['Beaverton','Hillsboro','Gresham','Lake Oswego','Tigard','Tualatin','Sherwood','Milwaukie','Oregon City','Clackamas'] },
  ],
  Tampa: [
    { from: 33601, to: 33619, hoods: ['Ybor City','Channel District','Hyde Park','Seminole Heights','Riverside Heights','Sulphur Springs','Westshore','South Tampa','Carrollwood','New Tampa'] },
    { from: 33620, to: 33699, hoods: ['St. Petersburg','Clearwater','Brandon','Riverview','Valrico','Wesley Chapel','Land O\' Lakes','Lutz','Plant City','Dunedin'] },
  ],
  'Las Vegas': [
    { from: 89101, to: 89120, hoods: ['Arts District','Downtown Las Vegas','Paradise','Winchester','Spring Valley','Whitney','Sunrise Manor','East Las Vegas','Henderson North','Green Valley'] },
    { from: 89121, to: 89199, hoods: ['Summerlin South','Summerlin North','Centennial Hills','Aliante','Lone Mountain','Enterprise','Mountain\'s Edge','MacDonald Ranch','Whitney Ranch','Henderson South'] },
  ],
  Minneapolis: [
    { from: 55401, to: 55420, hoods: ['Uptown','Lyn-Lake','Whittier','Powderhorn','Seward','Longfellow','Nokomis','Northeast MPLS','Marcy-Holmes','Dinkytown'] },
    { from: 55421, to: 55499, hoods: ['St. Louis Park','Hopkins','Edina','Minnetonka','Bloomington','Richfield','Burnsville','Eden Prairie','Plymouth','Brooklyn Park'] },
  ],
  Baltimore: [
    { from: 21201, to: 21218, hoods: ['Federal Hill','Fells Point','Canton','Hampden','Charles Village','Roland Park','Remington','Mount Vernon','Station North','Highlandtown'] },
    { from: 21219, to: 21299, hoods: ['Towson','Catonsville','Pikesville','Owings Mills','Columbia','Ellicott City','Annapolis','Severna Park','Glen Burnie','Edgewater'] },
  ],
  Louisville: [
    { from: 40201, to: 40220, hoods: ['NuLu','Butchertown','Germantown','Highlands','Crescent Hill','Clifton','St. Matthews','Bardstown Road','Middletown','Lyndon'] },
    { from: 40221, to: 40299, hoods: ['New Albany','Jeffersonville','Clarksville','Shively','Audubon Park','Pleasure Ridge Park','Okolona','Newburg','Jeffersontown','Fern Creek'] },
  ],
  Indianapolis: [
    { from: 46201, to: 46220, hoods: ['Fountain Square','Bates-Hendricks','Fletcher Place','Mass Ave','Broad Ripple','Irvington','Meridian-Kessler','Butler-Tarkington','Eagle Creek','Warren Township'] },
    { from: 46221, to: 46299, hoods: ['Carmel','Fishers','Noblesville','Greenwood','Plainfield','Avon','Lawrence','Beech Grove','Speedway','Zionsville'] },
  ],
  Columbus: [
    { from: 43201, to: 43215, hoods: ['Short North','Italian Village','Victorian Village','German Village','Olde Towne East','Clintonville','Bexley','Grandview Heights','Upper Arlington','Hilliard'] },
    { from: 43216, to: 43299, hoods: ['Dublin','Westerville','Gahanna','New Albany','Pickerington','Reynoldsburg','Grove City','Canal Winchester','Powell','Lewis Center'] },
  ],
  Memphis: [
    { from: 38101, to: 38120, hoods: ['Midtown','Cooper-Young','South Main','Overton Square','Crosstown','East Memphis','Germantown South','Collierville West','Bartlett South','Cordova West'] },
    { from: 38121, to: 38199, hoods: ['Germantown','Collierville','Bartlett','Millington','Cordova','Lakeland','Arlington','Southaven','Olive Branch','Horn Lake'] },
  ],
  'San Diego': [
    { from: 92101, to: 92120, hoods: ['North Park','South Park','Hillcrest','University Heights','Normal Heights','Mission Hills','Bankers Hill','Golden Hill','City Heights','Barrio Logan'] },
    { from: 92121, to: 92199, hoods: ['Ocean Beach','Mission Beach','Pacific Beach','La Jolla','Bay Park','Chula Vista','National City','El Cajon','Santee','Escondido'] },
  ],
  Jacksonville: [
    { from: 32201, to: 32220, hoods: ['Riverside','Avondale','Five Points','San Marco','Springfield','Murray Hill','Ortega','Mandarin','Southside','Baymeadows'] },
    { from: 32221, to: 32299, hoods: ['Atlantic Beach','Neptune Beach','Jacksonville Beach','Orange Park','Fleming Island','St. Augustine','Ponte Vedra','Middleburg','Yulee','Fernandina Beach'] },
  ],
};

// Flat fallback for cities not in METRO_ZIP_ZONES
const METRO_NEIGHBORHOODS_FALLBACK = {
  'Fort Worth': ['Near Southside','West 7th','Fairmount','Magnolia','Cultural District','Ryan Place','Mistletoe Heights','Tanglewood','Wedgwood','Arlington','Haltom City','Euless','Bedford','Keller','North Richland Hills'],
  'Oklahoma City': ['Midtown','Paseo','Automobile Alley','Film Row','Bricktown','Gatewood','Mesta Park','Crown Heights','Nichols Hills','Heritage Hills','Edmond','Norman','Moore','Yukon','Mustang'],
  'Richmond': ['The Fan','Carytown','Scott\'s Addition','Jackson Ward','Church Hill','Oregon Hill','Shockoe Bottom','Manchester','Museum District','Northside','Short Pump','Henrico','Chesterfield','Midlothian','Chester'],
  'New Orleans': ['Marigny','Bywater','Tremé','Garden District','Irish Channel','Uptown','Carrollton','Mid-City','Gentilly','Lakeview','Metairie','Kenner','Gretna','Harvey','Westbank'],
  'Salt Lake City': ['Sugar House','9th & 9th','Liberty Wells','Avenues','Capitol Hill','Rose Park','Marmalade','East Bench','Millcreek','Holladay','South Salt Lake','Murray','Sandy','Draper','South Jordan'],
  'Kansas City': ['Crossroads','Westside','Waldo','Brookside','Plaza','Hyde Park','Volker','Midtown','Northland','East Side','Overland Park','Lenexa','Olathe','Shawnee','Lee\'s Summit'],
  'Virginia Beach': ['ViBe District','Oceanfront','Shore Drive','Kempsville','Bayside','Princess Anne','Sandbridge','Town Center','Great Neck','Red Mill','Chesapeake','Norfolk','Portsmouth','Suffolk','Hampton'],
  Omaha: ['Benson','Dundee','Blackstone','Aksarben','Midtown','Florence','North Omaha','South Omaha','Millard','Elkhorn','Papillion','Bellevue','La Vista','Ralston','Gretna'],
  Tucson: ['Armory Park','Barrio Viejo','Sam Hughes','Millville','Iron Horse','Blenman-Elm','Catalina Foothills','Civano','Rita Ranch','Marana','Oro Valley','Sahuarita','Green Valley','Vail','Sierra Vista'],
  Albuquerque: ['Nob Hill','EDo','Barelas','Old Town','South Valley','Uptown','North Valley','Corrales','Los Ranchos','Rio Rancho','Bernalillo','Bosque Farms','Los Lunas','Belen','Santa Fe'],
  Fresno: ['Tower District','Granville','Sunnyside','McLane','Edison','Fig Garden','Old Fig Garden','Bullard','Northwest','Woodward Park','Clovis','Madera','Visalia','Hanford','Selma'],
  Sacramento: ['Midtown','East Sacramento','Land Park','Curtis Park','Oak Park','Boulevard Park','Arden-Arcade','Tahoe Park','Pocket','Natomas','Elk Grove','Roseville','Folsom','Rocklin','Rancho Cordova'],
  Milwaukee: ['Walker\'s Point','Bay View','Brady Street','Historic Third Ward','Riverwest','Brewer\'s Hill','Harambee','Washington Heights','Wauwatosa','Shorewood','Whitefish Bay','Fox Point','Glendale','West Allis','Greenfield'],
  // Mid-size metros — flat lists (single urban core, radius controls count)
  Tucson: ['Sam Hughes','Armory Park','Barrio Viejo','Millville','Iron Horse','Blenman-Elm','Broadmoor-Broadway','Catalina Foothills','Civano','Rita Ranch','Marana','Oro Valley','Sahuarita','Green Valley','Vail'],
  Albuquerque: ['Nob Hill','EDo','Barelas','Old Town','South Valley','Los Ranchos','North Valley','Corrales','Four Hills','Tijeras','Rio Rancho East','Bernalillo','Bosque Farms','Los Lunas','Belen'],
  'Salt Lake City': ['Sugar House','9th & 9th','Liberty Wells','Avenues','Capitol Hill','Rose Park','Marmalade','East Bench','Millcreek','Holladay','South Salt Lake','Murray','Sandy','Draper','South Jordan'],
  'Kansas City': ['Crossroads','Westside','Waldo','Brookside','Plaza','Hyde Park','Volker','Midtown','Northland','East Side','Overland Park','Lenexa','Olathe','Shawnee','Lee\'s Summit'],
  'New Orleans': ['Marigny','Bywater','Tremé','Garden District','Irish Channel','Uptown','Carrollton','Mid-City','Gentilly','Lakeview','Metairie','Kenner','Gretna','Harvey','Westbank'],
  'Oklahoma City': ['Midtown','Paseo','Automobile Alley','Film Row','Bricktown','Gatewood','Mesta Park','Crown Heights','Nichols Hills','Heritage Hills','Edmond','Norman','Moore','Yukon','Mustang'],
  'Fort Worth': ['Near Southside','West 7th','Fairmount','Magnolia','Cultural District','Ryan Place','Mistletoe Heights','Tanglewood','Wedgwood','Summerfields','Arlington','Haltom City','Euless','Bedford','Keller'],
  'Virginia Beach': ['ViBe District','Oceanfront','Shore Drive','Kempsville','Bayside','Princess Anne','Sandbridge','Town Center','Great Neck','Red Mill','Chesapeake','Norfolk','Portsmouth','Suffolk','Hampton'],
  Omaha: ['Benson','Dundee','Blackstone','Aksarben','Midtown','Florence','North Omaha','South Omaha','Millard','Elkhorn','Papillion','Bellevue','La Vista','Ralston','Gretna'],
  Fresno: ['Tower District','Granville','Sunnyside','McLane','Edison','Fig Garden','Old Fig Garden','Bullard','Northwest','Woodward Park','Clovis','Madera','Visalia','Hanford','Selma'],
  Sacramento: ['Midtown','East Sacramento','Land Park','Curtis Park','Oak Park','Boulevard Park','Arden-Arcade','Tahoe Park','Pocket','Natomas','Elk Grove','Roseville','Folsom','Rocklin','Rancho Cordova'],
  Richmond: ['The Fan','Carytown','Scott\'s Addition','Jackson Ward','Church Hill','Oregon Hill','Shockoe Bottom','Manchester','Museum District','Northside','Short Pump','Henrico','Chesterfield','Midlothian','Chester'],
  Cincinnati: ['Over-the-Rhine','Mount Adams','Hyde Park','Oakley','Clifton','Northside','Walnut Hills','Mount Lookout','Anderson Township','Blue Ash','Covington','Newport','Florence','West Chester','Mason'],
  Cleveland: ['Ohio City','Tremont','Detroit Shoreway','Lakewood','Cleveland Heights','Shaker Heights','University Circle','Little Italy','East 4th','Gordon Square','Parma','Brooklyn','Euclid','Westlake','Mentor'],
  Pittsburgh: ['Shadyside','Squirrel Hill','Lawrenceville','Strip District','South Side','Mt. Washington','Bloomfield','East Liberty','Regent Square','Brookline','North Shore','Allegheny West','Carrick','Scott Township','Bethel Park'],
  Boise: ['Downtown Boise','Bench','North End','East End','Harrison Blvd','Vista','Southeast Boise','Meridian','Eagle','Star','Nampa','Caldwell','Garden City','Kuna','Mountain Home'],
  'Colorado Springs': ['Old Colorado City','Manitou Springs','Broadmoor','Briargate','Northgate','Fountain Valley','Security','Widefield','Pueblo North','Black Forest','Monument','Castle Rock','Parker','Woodmoor','Palmer Lake'],
  'El Paso': ['Downtown El Paso','Kern Place','Sunset Heights','Five Points','Mesa Hills','Upper Valley','East El Paso','Socorro','Horizon City','Canutillo','Santa Teresa','Las Cruces','Sunland Park','Anthony','Fabens'],
  Honolulu: ['Downtown Honolulu','Chinatown','Kaka\'ako','Ala Moana','Manoa','Makiki','Nuuanu','Punchbowl','Kaimuki','Kapahulu','Hawaii Kai','Kaneohe','Kailua','Aiea','Pearl City'],
  Tulsa: ['Brady Arts District','Cherry Street','Brookside','Midtown Tulsa','Maple Ridge','Gilcrease Hills','Jenks','Bixby','Sand Springs','Owasso','Broken Arrow','Catoosa','Claremore','Sapulpa','Wagoner'],
  Wichita: ['Delano','College Hill','Riverside','Crown Heights','Eastborough','Andover','Derby','Goddard','Maize','Valley Center','Newton','El Dorado','Augusta','Haysville','Mulvane'],
  'Baton Rouge': ['Mid City','Beauregard Town','Spanish Town','Garden District BR','Shenandoah','Sherwood Forest','Broadmoor BR','Zachary','Central','Prairieville','Denham Springs','Walker','Port Allen','Gonzales','Baker'],
  Greensboro: ['Fisher Park','Sunset Hills','Irving Park','Lindley Park','Friendly Center','Summerfield','McLeansville','Kernersville','Gibsonville','Burlington','High Point','Winston-Salem','Mebane','Graham','Eden'],
  Knoxville: ['Old City','Fort Sanders','Marble Springs','Fourth & Gill','Parkridge','Sequoyah Hills','Bearden','West Hills','Farragut','Maryville','Oak Ridge','Norris','Lenoir City','Powell','Halls'],
  Lexington: ['Chevy Chase','Ashland','Kenwick','Northside KY','Woodland Park','Beaumont','Hamburg','Andover','Richmond Road','Man O\'War','Nicholasville','Georgetown KY','Winchester','Paris KY','Versailles'],
  Anchorage: ['Midtown Anchorage','Spenard','Mountain View','Fairview','South Addition','Rogers Park AK','Government Hill','Rabbit Creek','Eagle River','Chugiak','Wasilla','Palmer','Kenai','Homer','Soldotna'],
  'Corpus Christi': ['Downtown CC','Flour Bluff','North Beach','Calallen','Portland TX','Robstown','Aransas Pass','Rockport','Victoria TX','Gregory','Ingleside','Sinton','Alice','Beeville','Refugio'],
  'Little Rock': ['Hillcrest AR','Heights AR','Stifft Station','Quapaw Quarter','West Little Rock','Maumelle','Conway AR','Sherwood AR','Jacksonville AR','Cabot','Bryant AR','Benton AR','North Little Rock','Pulaski Heights','The Village at Hendrix'],
  'Winston-Salem': ['Downtown WS','West End','Ardmore','Buena Vista','Sherwood Forest WS','Lewisville','Clemmons','Kernersville','Advance','Mocksville','High Point','Greensboro West','Lexington NC','Boone NC','Mount Airy'],
  'Spokane': ['South Hill','Browne\'s Addition','Perry District','West Central','Kendall Yards','Nevada-Lidgerwood','Audubon-Downriver','Logan','Moran Prairie','Liberty Lake','Spokane Valley','Cheney','Deer Park','Medical Lake','Airway Heights'],
  'Des Moines': ['East Village IA','Sherman Hill','Ingersoll Park','Beaverdale','North of Grand','Ankeny','Urbandale','Clive','West Des Moines','Johnston','Altoona','Norwalk','Waukee','Indianola','Ames'],
};

// How many neighborhoods to show at each radius breakpoint
function neighborhoodCountForRadius(radius) {
  if (radius <= 3)  return 3;
  if (radius <= 7)  return 5;
  if (radius <= 12) return 8;
  if (radius <= 18) return 11;
  return 15;
}

// How many county/state cities to show at each radius (for non-metro ZIPs)
function cityLimitsForRadius(radius) {
  if (radius <= 5)  return { county: 3, state: 0 };
  if (radius <= 10) return { county: 5, state: 2 };
  if (radius <= 15) return { county: 6, state: 4 };
  if (radius <= 20) return { county: 7, state: 5 };
  return                   { county: 8, state: 4 };
}

// Returns neighborhood names for major metros, or nearby cities for everywhere else.
function nearbyCities(locationInfo, radius) {
  if (!locationInfo) return [];
  const { state, county, city } = locationInfo;

  const zip = parseInt(locationInfo.zip || '0', 10);
  const count = neighborhoodCountForRadius(radius);

  // ZIP-aware zone lookup — returns hoods near the user's actual ZIP
  const zones = METRO_ZIP_ZONES[city];
  if (zones && zip > 0) {
    const zone = zones.find(z => zip >= z.from && zip <= z.to) || zones[0];
    return zone.hoods.slice(0, count);
  }

  // Flat fallback for cities not in METRO_ZIP_ZONES
  const fallback = METRO_NEIGHBORHOODS_FALLBACK[city];
  if (fallback) return fallback.slice(0, count);

  // Non-metro fallback: same county cities then state cities
  const limits = cityLimitsForRadius(radius);
  const seen = new Set([city]);
  const sameCounty = [];
  const sameState = [];
  for (const [z, v] of Object.entries(ZIP_DB)) {
    const [s, c, co] = v;
    if (!c) continue;
    const name = resolveCity(z, c, co, s);
    if (!name || name === city || seen.has(name)) continue;
    // Skip generic county fallbacks in the list — only use real place names
    if (name.endsWith(" County")) continue;
    if (s !== state) continue;
    if (county && co === county && sameCounty.length < limits.county) {
      seen.add(name); sameCounty.push(name);
    } else if (sameState.length < limits.state + 4) {
      sameState.push(name);
    }
    if (sameCounty.length >= limits.county && sameState.length >= limits.state + 4) break;
  }
  const out = [...sameCounty];
  for (const c of sameState) {
    if (out.length >= limits.county + limits.state) break;
    if (!seen.has(c)) { seen.add(c); out.push(c); }
  }
  return out;
}

export default function RentNearbyScreen({ data, onBack, onNext }) {
  const C = useTheme();
  const d = data;
  const loc = d.locationInfo || {};
  const grossMo = Math.round((d.income || 0) / 12);
  const conservativeBudget = Math.round(grossMo * 0.25);
  const standardBudget = Math.round(grossMo * 0.30);
  const stretchBudget = Math.round(grossMo * 0.35);
  const targetRent = d.targetRent || standardBudget;
  const cityName = resolveCity(loc.zip, loc.city, loc.county, loc.state);
  const [radius, setRadius] = useState(5);

  const cities = useMemo(() => nearbyCities(loc, radius), [loc.state, loc.county, loc.city, radius]);

  const searchRentals = (cityLabel) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(`apartments for rent in ${cityLabel} ${loc.state || ""}`)}`;
    Linking.canOpenURL(url).then(supported => { if (supported) Linking.openURL(url); }).catch(() => {});
  };


  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}>

      {/* Your target area */}
      <Card style={{ borderWidth: 1.5, borderColor: C.blue }}>
        <SecTitle>Your target area</SecTitle>
        <Text style={{ fontSize: 16, fontWeight: "900", color: C.charcoal, marginBottom: 4 }}>{cityName}{loc.state ? ", " + loc.state : ""}</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <Text style={{ fontSize: 12, color: C.gray500 }}>Your target rent</Text>
          <Text style={{ fontSize: 18, fontWeight: "900", color: C.blue }}>{fmt(targetRent)}/mo</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {[
            { label: "Conservative (25%)", amt: conservativeBudget, color: "#16A34A" },
            { label: "Standard (30%)", amt: standardBudget, color: C.blue },
            { label: "Stretch (35%)", amt: stretchBudget, color: "#D97706" },
          ].map((t, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: C.card, borderRadius: 8, padding: 7, alignItems: "center", borderWidth: 1, borderColor: C.gray200 }}>
              <Text style={{ fontSize: 9, fontWeight: "600", color: C.gray500, textAlign: "center" }}>{t.label}</Text>
              <Text style={{ fontSize: 12, fontWeight: "900", color: t.color, marginTop: 2 }}>{fmt(t.amt)}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Radius control */}
      <Card>
        <SecTitle>Search radius</SecTitle>
        <SliderRow label="Show areas within" min={1} max={25} step={1} value={radius} onChange={setRadius} display={`${radius} mi`} color={C.blue} note="Adjust to find areas matching your budget" />
      </Card>

      {/* Nearby areas */}
      <Card>
        <SecTitle>Other areas to explore{loc.county ? " in " + loc.county + " County" : ""}</SecTitle>
        <Text style={{ fontSize: 11, color: C.gray500, marginBottom: 12 }}>
          Rents vary by area. Tap any city to search current listings.
        </Text>
        {cities.length === 0 ? (
          <Text style={{ fontSize: 12, color: C.gray500 }}>Enter your ZIP code on step 1 to see nearby areas.</Text>
        ) : cities.map((c, i) => (
          <TouchableOpacity
            key={c}
            onPress={() => searchRentals(c)}
            style={{ flexDirection: "row", alignItems: "center", paddingVertical: 11, borderBottomWidth: i < cities.length - 1 ? 0.5 : 0, borderBottomColor: C.gray100 }}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: C.charcoal }}>{c}</Text>
              <Text style={{ fontSize: 10, color: C.gray500 }}>{loc.state}</Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: "700", color: C.blue }}>Search rentals →</Text>
          </TouchableOpacity>
        ))}
      </Card>

      <NavButtons onBack={onBack} onNext={onNext} nextLabel="Move-in plan →" accent={C.blue} />
    </ScrollView>
  );
}
