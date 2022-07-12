// TypeScript typed version of `read-uint`
// Reference: https://github.com/coderaiser/read-uint
// Developed by: coderaiser <https://github.com/coderaiser>
// Typed version by: Nicholas Nelson <https://github.com/nelsonni>

const addZero = (a: string) => {
    if (a.length === 1)
        return `0${a}`;
    return a;
}

const rmLeadingZeros = (a: string) => {
    const n = a.length - 1;
    let i = 0;

    while (a[i] === '0' && i < n) {
        ++i;
    }

    return a.slice(i);
}

export const readUIntBE = (buf: Buffer, offset: number, length = 8) => {
    const data = [];
    let i = -1;

    while (++i < length) {
        const current = buf[offset + i]?.toString(16);

        if (!i) {
            data.push(current);
            continue;
        }

        data.push(current ? addZero(current) : current);
    }

    const str = data.join('');
    const result = rmLeadingZeros(str);
    return `0x${result}`;
}

export const readUIntLE = (buf: Buffer, offset: number, length = 8) => {
    const data = [];
    let i = length;

    while (--i > -1) {
        const current = buf[offset + i]?.toString(16);

        if (i === length - 1) {
            data.push(current);
            continue;
        }

        data.push(current ? addZero(current) : current);
    }

    const str = data.join('');
    const result = rmLeadingZeros(str);
    return `0x${result}`;
}