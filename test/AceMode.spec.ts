/// <reference path="../src/core/global.d.ts" />
import { expect } from 'chai';
import { modeMap } from '../src/app/aceMode/modes';

describe('AceMode', () => {

  it('Should return C_Cpp for hh', () => {
    expect(modeMap.get('hh')).to.equal('C_Cpp');
  });

});
