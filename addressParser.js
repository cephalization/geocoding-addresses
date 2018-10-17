const fs = require('fs');
const targz = require('targz');
const reader = require('line-by-line');
const geocoder = require('@google/maps').createClient({
  // I know this is insecure, but this is a private repo
  // Will regenerate key before sharing this with y'all at Ambyint :)
  key: 'AIzaSyDJ9gAVmjgDP33RHQNN6YK3TwJBxTmqmw8',
  Promise,
}).geocode;

const ADDRESS_PARSE_RULES = [
  { rule: 'House Number', limit: 30, delim: ' ' },
  { rule: 'Street Direction Prefix', limit: 2, delim: ' ' },
  { rule: 'Street Name', limit: 40, delim: ' ' },
  { rule: 'Street Suffix', limit: 4, delim: ' ' },
  { rule: 'Street Direction Suffix', limit: 2, delim: ', ' },
  { rule: 'Unit Descriptor', limit: 10, delim: ' ' },
  { rule: 'Unit Number', limit: 6, delim: ', ' },
  { rule: 'City', limit: 30, delim: ', ' },
  { rule: 'State', limit: 2, delim: ', ' },
  { rule: 'Zip', limit: 12, delim: '' },
];
const ADDRESS_FILE = './addresses.txt';

/**
 * Decompress src file into dest directory
 *
 * @param {string} src relative file path of file to be decompressed
 * @param {string} dest relative file path of decompression results
 * @param {function} callback function to be called after a SUCCESSFUL decompression
 */
const decompressFile = (src, dest, callback) => {
  targz.decompress({ src, dest },
    (error) => {
      if (error) {
        console.error(error);

        return null;
      }

      return callback();
    });
};

/**
 * Encode provided address
 *
 * @param {string} address to be encoded
 *
 * @return {string|null} formatted string containing lat, long; Or null if the address was not
 *  properly encoded
 */
const geocodeAddress = async (address) => {
  let response = null;

  try {
    // Make request to google geocode api for address
    response = await geocoder({ address }).asPromise();
    response = response.json.results[0];

    // Determine if the address matches criteria
    if (
      response != null
      && response.partial_match !== true
      && response.geometry.location_type === 'ROOFTOP'
    ) {
      const encodedAddress = response.geometry.location;

      return `${encodedAddress.lat}, ${encodedAddress.lng}`;
    }

    // The encoded address did not meet criteria
    return null;
  } catch (e) {
    console.error('Geocoder request failed...', e);

    return null;
  }
};

/**
 * Given a line of address content, parse based on ADDRESS_PARSE_RULES
 *
 * @param {string} line address line from addresses.txt
 *
 * @return {object|null} encoded and unencoded address
 *  { encoded: {string}, unencoded: {string} }
 */
const processAddressLine = async (line) => {
  let address = '';
  let readCharacters = 0;

  ADDRESS_PARSE_RULES.forEach((rule) => {
    const segment = line
      .slice(readCharacters, readCharacters + rule.limit)
      .trim();
    readCharacters += rule.limit;

    address = `${address}${segment}${segment.length ? rule.delim : ''}`;
  });

  const encodedAddress = await geocodeAddress(address);

  if (encodedAddress !== null) {
    return {
      encoded: encodedAddress,
      unencoded: address,
    };
  }

  return null;
};

/**
 * Read address text file
 *
 * @return {array} objects containing encoded and un-encoded addresses
 * [
 *  { encoded: {string}, unencoded: {string} }
 * ]
 */
const readAddressesFile = () => {
  console.log('Reading and encoding valid addresses...');
  return new Promise((resolve, reject) => {
    const lines = new reader(ADDRESS_FILE, { encoding: 'utf8', skipEmptyLines: true });
    const addresses = [];

    // Process each line based on the rules, add it to array of addresses
    lines.on('line', async (line) => {
      lines.pause();
      const address = await processAddressLine(line);
      if (address !== null) {
        addresses.push(address);
        console.log(address);
      }
      lines.resume();
    });

    lines.on('error', (err) => {
      console.log('Error parsing addresses file...', err);
      reject(addresses);
    });

    lines.on('end', () => {
      console.log(addresses.length, 'addresses parsed');
      resolve(addresses);
    });
  });
};

/**
 * Decompress, parse, and geo-encode addresses
 *
 * @param {string} src compressed archive of addresses
 *
 * @return {array} objects containing encoded and un-encoded addresses
 * [
 *  { encoded: {string}, unencoded: {string} }
 * ]
 */
const getGeocodedAddresses = (src) => {
  try {
    if (!fs.existsSync(ADDRESS_FILE)) {
      console.log('File does not exist, uncompressing archive...');
      decompressFile(src, './', readAddressesFile);
    } else {
      console.log('File exists, re-parsing archive');
      readAddressesFile();
    }
  } catch (error) {
    console.error(error);
  }
};

getGeocodedAddresses('./addresses.tar.gz');

module.exports = {
  getGeocodedAddresses,
};