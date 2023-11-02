import config from '../config/config';
import { Address, LocationInFlanders, addressMatchResultSchema } from '../types';
import postalCodeToProvince from '../postcode-province/postcode-province';
import { encodeValuesURI } from '../util/util';

export default async function getAllAddresses(
  location: LocationInFlanders
): Promise<Address[]> {
  console.log(`Request:${getAllAddressesSearchUrl(location)}`);
  const response = await fetch(getAllAddressesSearchUrl(location));
  const jsonLdBody = addressMatchResultSchema.parse(await response.json());
  const addresses = jsonLdBody.adresMatches.map<Address>((match)=>{
    return {
      country: 'België',
      province: postalCodeToProvince(match.postinfo.objectId),
      municipality: match.gemeente.gemeentenaam.geografischeNaam.spelling,
      postalCode: match.postinfo.objectId,
      street: match.straatnaam.straatnaam.geografischeNaam.spelling,
      houseNumber: match.huisnummer,
      boxNumber: match.busnummer ?? null,
    };
  });

  return addresses;
}

function getAllAddressesSearchUrl(location: LocationInFlanders) {
  const uriEncodedLocation = encodeValuesURI(location);
  return `${config.BASISREGISTER_ADDRESSES_SEARCH_URL}?gemeentenaam=${uriEncodedLocation.municipality}&postcode=${uriEncodedLocation.postalCode}&straatnaam=${uriEncodedLocation.street}&huisnummer=${uriEncodedLocation.housenumber}`;
}