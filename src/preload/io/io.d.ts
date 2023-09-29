/**
 * Encoding formats that adhere to the name of [Node.js-supported
 * encodings](https://stackoverflow.com/questions/14551608/list-of-encodings-that-node-js-supports#14551669).
 */
export type NodeEncoding =
  | 'ascii'
  | 'utf8'
  | 'utf-8'
  | 'utf16le'
  | 'ucs2'
  | 'ucs-2'
  | 'base64'
  | 'base64url'
  | 'latin1'
  | 'binary'
  | 'hex';

/**
 * Encoding formats that adhere to the name of decoding algorithms available for
 * [TextDecoder.prototype.encoding](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder/encoding).
 * Except for `bytes`, which directly maps to the notion of a `byte-array` in other languages. This
 * format requires encoding in a `Uint8Array` within JavaScript/TypeScript.
 */
export type DecoderEncoding =
  | 'utf-8'
  | 'ibm866'
  | 'iso-8859-2'
  | 'iso-8859-3'
  | 'iso-8859-4'
  | 'iso-8859-5'
  | 'iso-8859-6'
  | 'iso-8859-7'
  | 'iso-8859-8'
  | 'iso-8859-8i'
  | 'iso-8859-10'
  | 'iso-8859-13'
  | 'iso-8859-14'
  | 'iso-8859-15'
  | 'iso-8859-16'
  | 'koi8-r'
  | 'koi8-u'
  | 'macintosh'
  | 'windows-874'
  | 'windows-1250'
  | 'windows-1251'
  | 'windows-1252'
  | 'windows-1253'
  | 'windows-1254'
  | 'windows-1255'
  | 'windows-1256'
  | 'windows-1257'
  | 'windows-1258'
  | 'x-mac-cyrillic'
  | 'gbk'
  | 'gb18030'
  | 'hz-gb-2312'
  | 'big5'
  | 'euc-jp'
  | 'iso-2022-jp'
  | 'shift-jis'
  | 'euc-kr'
  | 'iso-2022-kr'
  | 'utf-16be'
  | 'utf-16le'
  | 'bytes';
