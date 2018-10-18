const addressParser = require('../addressParser');
const expect = require('chai').expect;
const sinon = require('sinon');

describe('Address formatting', () => {
  const geocodeAddressStub = sinon.stub(addressParser, 'geocodeAddress').returns('');

  it('Formats a line correctly ', async () => {
    const testLine = '346                             SUMMER                                  LN                    MAPLEWOOD                     MN55117           ';
    const expectedAddress = '346 SUMMER LN, MAPLEWOOD, MN, 55117';
    const address = await addressParser.processAddressLine(testLine);

    expect(address.unencoded).to.be.equal(expectedAddress);
  });

  it('Formats a fully qualified line correctly ', async () => {
    const testLine = '767                             CAPITOL                                 HTS   #         22    SAINT PAUL                    MN55103          ';
    const expectedAddress = '767 CAPITOL HTS # 22, SAINT PAUL, MN, 55103';
    const address = await addressParser.processAddressLine(testLine);

    expect(address.unencoded).to.be.equal(expectedAddress);
  });

  after(() => {
    geocodeAddressStub.restore();
  });
});
