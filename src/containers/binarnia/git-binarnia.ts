// TypeScript typed version of `binarnia`
// Reference: https://github.com/coderaiser/binarnia
// Developed by: coderaiser <https://github.com/coderaiser>
// Typed version by: Nicholas Nelson <https://github.com/nelsonni>

import { curry } from './git-curry';
import { readUIntBE, readUIntLE } from './git-read-uint';

type Offset = number | string;
// Descriminated union for ensuring additional fields are matched to their 'type' value
type ItemBase = { name: string, size: number | string, type: string };
type ValueItem = ItemBase & { type: 'value', offset?: Offset };
type StringItem = ItemBase & { type: 'string', offset?: Offset };
type IgnoreItem = ItemBase & { type: 'ignore' };
type BitItem = ItemBase & { type: 'bit', bit: { [key: string]: string } };
type EnumItem = ItemBase & { type: 'enum', enum: { [key: string]: string }, offset?: Offset };
type ArrayItem = ItemBase & { type: 'array', array: string[], offset?: Offset };
type Item = ValueItem | StringItem | IgnoreItem | BitItem | EnumItem | ArrayItem;
export type Schema = Item[];
type Endian = 'BE' | 'LE';

const getReadHex = curry((endian: Endian, buffer: Buffer, offset: number, length: number): string => {
    if (endian === 'LE') return readUIntLE(buffer, offset, length);
    return readUIntBE(buffer, offset, length);
});

const parseOffset = (offset: Offset): number => {
    if (typeof offset !== 'string') return offset;
    return parseInt(offset, 16);
}

const parseSize = (size: number | string, result: { [key: string]: unknown }): number => {
    if (typeof size === 'number') return size;

    const name = size.replace(/[<>]/g, '');
    if (name in result) {
        const lookup = result[name];
        if (typeof lookup === 'string') {
            return parseInt(lookup, 16);
        }
    }
    return 0;
}

const parseBit = (item: BitItem, value: string) => {
    const firstResult = item.bit[value];

    if (firstResult) return [firstResult].join('');

    const bits = Object.keys(item.bit);

    const result = [];
    const numberValue = parseInt(value, 16);

    for (const bit of bits) {
        const number = parseInt(bit, 16);

        if (!(number & numberValue)) continue;

        result.push(item.bit[bit]);
    }

    return result.join('');
}

const convertCodeToChar = (result: string[], hex: string) => (i: number) => {
    const number = hex.substring(i, i + 2);
    const code = parseInt(number, 16);
    const str = String.fromCharCode(code);

    result.push(str);
}

const parseString = (hex: string, endian: Endian): string => {
    const n = hex.length;
    const result: string[] = [];
    const start = '0x'.length;
    const convert = convertCodeToChar(result, hex);

    if (endian === 'BE') {
        for (let i = start; i < n; i += 2) {
            convert(i);
        }
    } else {
        for (let i = n - start; i > 0; i -= 2) {
            convert(i);
        }
    }
    return result.join('');
}



/** 
 * @deprecated This implementation is an internal rewrite of the `binarnia` package into TypeScript, please use `git ls-files` or 
 * similar functionality found in the `containers/git/*` directory.  
 * @param options - X
 * @param options.schema - X
 * @param options.buffer - X
 * @param options.endian - X
 * @param options.offset - X
 * @returns {Map} X
 */
export const binarnia = (options: {
    schema: Schema,
    buffer: Buffer,
    endian?: Endian,
    offset?: Offset
}) => {
    const {
        schema,
        buffer,
        offset = '0x0',
        endian = 'LE'
    } = options;

    const readHex = getReadHex(endian);

    const result: { [key: string]: unknown } = {};

    let currentOffset = parseOffset(offset);

    for (const item of schema) {
        const { type, name, size } = item;

        const itemOffset = 'offset' in item ? parseOffset(item.offset) : undefined;
        const parsedSize = parseSize(size, result);
        const resultOffset = itemOffset || currentOffset;

        const value = readHex(buffer, resultOffset, parsedSize);

        currentOffset += parsedSize;

        if (type === 'enum') {
            result[name] = item.enum[value] || value;
            continue;
        }

        if (type === 'array') {
            result[name] = item.array[parseInt(value, 16)];
            continue;
        }

        if (type === 'value') {
            result[name] = value;
            continue;
        }

        if (type === 'string') {
            result[name] = parseString(value, endian);
            continue;
        }

        if (type === 'bit') {
            result[name] = parseBit(item, value);
            continue;
        }

        if (type === 'ignore') {
            continue;
        }

        throw Error(`0x${resultOffset.toString(16)}: ${name}: behavior of type "${type}" is not defined`);
    }

    return result;
}

const toNumber = (a: string | number) => Number(a) || 0;

export const sizeof = (schema: Schema) => {
    return schema.reduce((a, b) => a + toNumber(b.size), 0);
}




