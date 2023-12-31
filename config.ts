export type Config = {
  FUZZY_SEARCH_API_URL: string,
  BASISREGISTER_ADDRESSES_SEARCH_URL: string,
  BASISREGISTER_MUNICIPALITY_SEARCH_URL: string,
  BASISREGISTER_POSTALCODE_SEARCH_URL: string,
  DBPEDIA_SPARQL_ENDPOINT: string,
}

const config: Config = {
  FUZZY_SEARCH_API_URL: 'https://geo.api.vlaanderen.be/geolocation/v4/Location',
  BASISREGISTER_ADDRESSES_SEARCH_URL: 'https://api.basisregisters.vlaanderen.be/v2/adresmatch',
  BASISREGISTER_MUNICIPALITY_SEARCH_URL: 'https://api.basisregisters.vlaanderen.be/v2/gemeenten',
  BASISREGISTER_POSTALCODE_SEARCH_URL: 'https://api.basisregisters.vlaanderen.be/v2/postinfo',
  DBPEDIA_SPARQL_ENDPOINT:'https://dbpedia.org/sparql',
};

export default config;