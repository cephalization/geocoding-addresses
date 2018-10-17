const fs = require('fs');
const targz = require('targz');
const reader = require('line-by-line');

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
 * Given a line of address content, parse based on ADDRESS_PARSE_RULES
 *
 * @param {string} line address line from addresses.txt
 *
 * @return {string} formatted address
 */
const processAddressLine = (line) => {
  let address = '';
  let readCharacters = 0;

  ADDRESS_PARSE_RULES.forEach((rule) => {
    const segment = line
      .slice(readCharacters, readCharacters + rule.limit)
      .trim();
    readCharacters += rule.limit;

    address = `${address}${segment}${segment.length ? rule.delim : ''}`;
  });

  return address;
};

/**
 * Read address text file
 *
 * @param {string} srcDir directory containing addresses.txt file containing address information
 */
const readAddressesFile = (srcDir) => {
  console.log('Reading addresses...');
  return new Promise((resolve) => {
    const lines = new reader(ADDRESS_FILE, { encoding: 'utf8', skipEmptyLines: true });
    const addresses = [];

    // Process each line based on the rules, add it to array of addresses
    lines.on('line', line => addresses.push(processAddressLine(line)));

    lines.on('error', (err) => {
      console.log('Error parsing addresses file...', err);
      resolve(addresses);
    });

    lines.on('end', () => {
      console.log(addresses.length, 'addresses parsed');
      resolve(addresses);
    });
  });
};

const geocodeAddresses = async (addresses) => {
  console.log('geocoding not implemented');
  // Make request to google geocode api for each address

  // Filter out partial results and non 'rooftop' quaility results

  // return new geocoded addresses paired with their original address
  return [];
};

const parseAddresses = async () => {
  const addresses = await readAddressesFile(ADDRESS_FILE);
  const geocodedAddresses = await geocodeAddresses(addresses);

  return geocodedAddresses;
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
const getGeocodedAddresses = async (src) => {
  let addresses = [];

  if (!fs.existsSync(ADDRESS_FILE)) {
    console.log('File does not exist, uncompressing archive...');
    addresses = await decompressFile(src, './', parseAddresses);
  } else {
    console.log('File exists, re-parsing archive');
    addresses = await parseAddresses();
  }

  console.log('addresses parsed');

  return addresses;
};

getGeocodedAddresses('./addresses.tar.gz');

module.exports = {
  getGeocodedAddresses,
};
