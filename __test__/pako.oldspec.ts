import mock from 'mock-fs';
// import sha1 from 'sha1';
// import pako from 'pako';
// import * as io from '../src/containers/io';
import * as git from '../src/containers/git-experimental';
// import { PathLike } from 'fs-extra';

beforeAll(() => {
  mock({
    'git_example': {
      'my_file.txt': 'My data fits on one line',
      '.git': {
        config: '[core]\nrepositoryformatversion = 0\nfilemode = true\nbare = false\nlogallrefupdates = true\nignorecase = true\nprecomposeunicode = true\n[remote "origin"]\nurl = git@github.com:test/test.git\nfetch = +refs / heads/*:refs/remotes/origin/*\n[branch "master"]\nremote = origin\nmerge = refs/heads/master',
        objects: {
          'd6': {
            '784742fd61d82720f3ed4e8d533fd03fe9b75c': Buffer.from([99, 111, 109, 109, 105, 116, 32, 49, 57, 55, 0, 116, 114, 101, 101, 32, 99, 99, 51, 48, 98, 48, 48, 101, 54, 48, 48, 56, 49, 55, 99, 53, 101, 55, 100, 52, 101, 99, 56, 53, 49, 102, 102, 55, 53, 57, 98, 51, 56, 98, 54, 53, 101, 102, 97, 53, 10, 97, 117, 116, 104, 111, 114, 32, 78, 105, 99, 104, 111, 108, 97, 115, 32, 78, 101, 108, 115, 111, 110, 32, 60, 110, 101, 108, 115, 111, 110, 110, 105, 64, 111, 114, 101, 103, 111, 110, 115, 116, 97, 116, 101, 46, 101, 100, 117, 62, 32, 49, 53, 56, 57, 52, 49, 52, 57, 52, 52, 32, 45, 48, 55, 48, 48, 10, 99, 111, 109, 109, 105, 116, 116, 101, 114, 32, 78, 105, 99, 104, 111, 108, 97, 115, 32, 78, 101, 108, 115, 111, 110, 32, 60, 110, 101, 108, 115, 111, 110, 110, 105, 64, 111, 114, 101, 103, 111, 110, 115, 116, 97, 116, 101, 46, 101, 100, 117, 62, 32, 49, 53, 56, 57, 52, 49, 52, 57, 52, 52, 32, 45, 48, 55, 48, 48, 10, 10, 102, 105, 114, 115, 116, 32, 99, 111, 109, 109, 105, 116, 10]),
          },
          'bc': {
            '4791fb13234461586a9cd874655432efc3691a': Buffer.from([99, 111, 109, 109, 105, 116, 32, 50, 52, 54, 0, 116, 114, 101, 101, 32, 57, 55, 54, 49, 101, 52, 56, 52, 102, 100, 100, 99, 102, 52, 54, 55, 48, 52, 48, 51, 101, 56, 49, 100, 50, 102, 49, 56, 50, 53, 53, 55, 51, 57, 98, 100, 56, 98, 98, 52, 10, 112, 97, 114, 101, 110, 116, 32, 100, 54, 55, 56, 52, 55, 52, 50, 102, 100, 54, 49, 100, 56, 50, 55, 50, 48, 102, 51, 101, 100, 52, 101, 56, 100, 53, 51, 51, 102, 100, 48, 51, 102, 101, 57, 98, 55, 53, 99, 10, 97, 117, 116, 104, 111, 114, 32, 78, 105, 99, 104, 111, 108, 97, 115, 32, 78, 101, 108, 115, 111, 110, 32, 60, 110, 101, 108, 115, 111, 110, 110, 105, 64, 111, 114, 101, 103, 111, 110, 115, 116, 97, 116, 101, 46, 101, 100, 117, 62, 32, 49, 53, 56, 57, 52, 49, 52, 57, 57, 54, 32, 45, 48, 55, 48, 48, 10, 99, 111, 109, 109, 105, 116, 116, 101, 114, 32, 78, 105, 99, 104, 111, 108, 97, 115, 32, 78, 101, 108, 115, 111, 110, 32, 60, 110, 101, 108, 115, 111, 110, 110, 105, 64, 111, 114, 101, 103, 111, 110, 115, 116, 97, 116, 101, 46, 101, 100, 117, 62, 32, 49, 53, 56, 57, 52, 49, 52, 57, 57, 54, 32, 45, 48, 55, 48, 48, 10, 10, 115, 101, 99, 111, 110, 100, 32, 99, 111, 109, 109, 105, 116, 10]),
          },
          'e2': {
            '7bb34b0807ebf1b91bb66a4c147430cde4f08f': Buffer.from([98, 108, 111, 98, 32, 50, 53, 0, 77, 121, 32, 100, 97, 116, 97, 32, 102, 105, 116, 115, 32, 111, 110, 32, 111, 110, 101, 32, 108, 105, 110, 101, 10]),
          },
          '75': {
            'af65d580b62fe4dc1e9cc6922bca9eef08b209': Buffer.from([98, 108, 111, 98, 32, 53, 55, 0, 77, 121, 32, 100, 97, 116, 97, 32, 102, 105, 116, 115, 32, 111, 110, 32, 111, 110, 101, 32, 108, 105, 110, 101, 10, 66, 117, 116, 32, 97, 110, 111, 116, 104, 101, 114, 32, 108, 105, 110, 101, 32, 104, 97, 115, 32, 98, 101, 101, 110, 32, 97, 100, 100, 101, 100, 10]),
          },
          '97': {
            '61e484fddcf4670403e81d2f18255739bd8bb4': Buffer.from([116, 114, 101, 101, 32, 51, 57, 0, 49, 48, 48, 54, 52, 52, 32, 109, 121, 95, 102, 105, 108, 101, 46, 116, 120, 116, 0, 117, 175, 101, 213, 128, 182, 47, 228, 220, 30, 156, 198, 146, 43, 202, 158, 239, 8, 178, 9]),
          },
          'cc': {
            '30b00e600817c5e7d4ec851ff759b38b65efa5': Buffer.from([116, 114, 101, 101, 32, 51, 57, 0, 49, 48, 48, 54, 52, 52, 32, 109, 121, 95, 102, 105, 108, 101, 46, 116, 120, 116, 0, 226, 123, 179, 75, 8, 7, 235, 241, 185, 27, 182, 106, 76, 20, 116, 48, 205, 228, 240, 143]),
          },
          '6d': {
            '67f18060a4a86a1524a7623b9bc29712feda1c': Buffer.from([98, 108, 111, 98, 32, 53, 50, 0, 77, 121, 32, 100, 97, 116, 97, 32, 102, 105, 116, 115, 32, 111, 110, 32, 111, 110, 101, 32, 108, 105, 110, 101, 10, 66, 117, 116, 32, 97, 110, 111, 116, 104, 101, 114, 32, 104, 97, 115, 32, 98, 101, 101, 110, 32, 97, 100, 100, 101, 100, 10]),
          }
        },
        HEAD: 'ref: refs/heads/master',
        info: {
          exclude: '# git ls-files --others --exclude-from=.git/info/exclude\n# Lines that start with \'#\' are comments.\n# For a project mostly in C, the following would be a good set of\n# exclude patterns(uncomment them if you want to use them):\n# *.[oa]\n# * ~\n.DS_Store'
        },
        description: 'Unnamed repository; edit this file \'description\' to name the repository.',
        hooks: {},
        refs: {
          heads: {},
          tags: {}
        },
        index: Buffer.from([68, 73, 82, 67, 0, 0, 0, 2, 0, 0, 0, 1, 94, 181, 141, 83, 2, 210, 75, 158, 94, 181, 141, 83, 2, 210, 75, 158, 1, 0, 0, 4, 3, 3, 122, 34, 0, 0, 129, 164, 0, 0, 1, 245, 0, 0, 0, 20, 0, 0, 0, 25, 226, 123, 179, 75, 8, 7, 235, 241, 185, 27, 182, 106, 76, 20, 116, 48, 205, 228, 240, 143, 0, 11, 109, 121, 95, 102, 105, 108, 101, 46, 116, 120, 116, 0, 0, 0, 0, 0, 0, 0, 51, 165, 87, 80, 230, 155, 125, 201, 27, 115, 55, 47, 202, 45, 29, 175, 250, 184, 156, 85]),
        branches: {}
      },
    },
  });
});

afterAll(mock.restore);

describe('git.checkout', () => {

  // it('git switch to develop branch', async () => {
  //   await git.checkout({
  //     dir: 'git_example',
  //     ref: 'develop'
  //   });
  //   const binaryIndex = await git.readGitObjectToUint8Array('git_example/.git/index');
  //   expect(binaryIndex).toStrictEqual(Buffer.from([68, 73, 82, 67, 0, 0, 0, 2, 0, 0, 0, 1, 94, 188, 131, 190, 8, 66, 41, 203, 94, 188, 131, 190, 8, 66, 41, 203, 1, 0, 0, 4, 3, 3, 122, 34, 0, 0, 129, 164, 0, 0, 1, 245, 0, 0, 0, 20, 0, 0, 0, 52, 109, 103, 241, 128, 96, 164, 168, 106, 21, 36, 167, 98, 59, 155, 194, 151, 18, 254, 218, 28, 0, 11, 109, 121, 95, 102, 105, 108, 101, 46, 116, 120, 116, 0, 0, 0, 0, 0, 0, 0, 61, 171, 225, 83, 150, 186, 146, 86, 19, 14, 238, 57, 0, 148, 126, 228, 253, 22, 99, 179]));
  // });

  it.each([
    ['git_example/.git/objects/d6/784742fd61d82720f3ed4e8d533fd03fe9b75c', 'd6784742fd61d82720f3ed4e8d533fd03fe9b75c'],
    ['git_example/.git/objects/bc/4791fb13234461586a9cd874655432efc3691a', 'bc4791fb13234461586a9cd874655432efc3691a'],
    ['git_example/.git/objects/e2/7bb34b0807ebf1b91bb66a4c147430cde4f08f', 'e27bb34b0807ebf1b91bb66a4c147430cde4f08f'],
    ['git_example/.git/objects/75/af65d580b62fe4dc1e9cc6922bca9eef08b209', '75af65d580b62fe4dc1e9cc6922bca9eef08b209'],
    //tree object ['git_example/.git/objects/97/61e484fddcf4670403e81d2f18255739bd8bb4', '9761e484fddcf4670403e81d2f18255739bd8bb4'],
    //tree object ['git_example/.git/objects/cc/30b00e600817c5e7d4ec851ff759b38b65efa5', 'cc30b00e600817c5e7d4ec851ff759b38b65efa5'],
    ['git_example/.git/objects/6d/67f18060a4a86a1524a7623b9bc29712feda1c', '6d67f18060a4a86a1524a7623b9bc29712feda1c'],
  ])('hashes match for %s', async (path, targetHash) => {
    const hash = await git.explodeHash(path);
    return expect(hash).toBe(targetHash);
  });

  // it('Print binary buffer from file', async () => {
  //   const incomingDir = '../git_example/.git/objects/'; // git_example/.git/objects/
  //   const fsObjects = await io.readDirAsyncDeep(incomingDir, false);
  //   const files = await io.filterReadArray(fsObjects, true);
  //   const gitFiles = await git.explodeGitFiles(files);
  //   gitFiles.map(f => process.stdout.write(`FILE: ${f.file}\ntargetHash: ${f.targetHash}\nhash: ${f.hash}\ndecoded: [${f.decoded}]\nbyte array:\n[${f.binary}]\n\n`));
  //   expect(true).toBe(true);
  // });

  // it('checkoutFile updates to master branch', async () => {
  //   return expect(git.checkoutFile('baz/some-file.js', 'master', true)).resolves.toBeDefined();
  // });

  // it('checkoutFile fails with a CommitNotFetchedError on non-local branches', async () => {
  //   // CommitNotFetchedError is thrown when a the latest commit for a branch is not available locally 
  //   // (i.e. the branch needs to be updated via git fetch)
  //   return expect(git.checkoutFile('baz/some-file.js', 'remote-only', true)).rejects.toThrow(/Failed to checkout .* because commit .* is not available locally/);
  // });
});

// describe('pako tests', () => {

//   // it('sha1 should work with \'test\'', () => {
//   //   const hash = sha1('test');
//   //   expect(hash).toEqual('a94a8fe5ccb19ba61c4c0873d391e987982fbbd3');
//   // });

//   // it('string to Buffer to string should be non-destructive', () => {
//   //   const buf = Buffer.from('abc');
//   //   expect(buf.toString()).toBe('abc');
//   // });

//   // it('pako.inflate should decompress data that was compressed by pako.deflate', () => {
//   //   const compressed = pako.deflate('abc');
//   //   const decompressed = pako.inflate(new Uint8Array(compressed), { to: 'string' });
//   //   expect(decompressed).toBe('abc');
//   // });

//   // it('pako.deflate should compress data string', () => {
//   //   const compressed = pako.deflate(`blob 17\x000abc\n`, { level: 1 });
//   //   const decompressed = pako.inflate(compressed, { to: 'string' });
//   //   expect(decompressed).toStrictEqual(`blob 17\x000abc\n`);
//   // });

//   // it('mocked file deflates', async () => {
//   //   const rawcontent = await io.readFileAsync('git_example/.git/objects/e2/7bb34b0807ebf1b91bb66a4c147430cde4f08f');
//   //   const compressed = pako.deflate(rawcontent, { level: 1 });
//   //   const decompressed = pako.inflate(compressed, { to: 'string' });
//   //   expect(decompressed).toBe(`blob 25\x00My data fits on one line\n`);
//   // });

//   // it('pako.inflate should decompress data that was compressed by git protocol', async () => {
//   //   const rawcontent = await io.readFileAsync('git_example/.git/objects/e2/7bb34b0807ebf1b91bb66a4c147430cde4f08f');
//   //   const compressed = pako.deflate(rawcontent, { level: 1 });
//   //   const decompressed = pako.inflate(compressed, { to: 'string' });
//   //   expect(decompressed).toBe(`blob 25\x00My data fits on one line\n`);
//   // });

//   // it('pako.deflate should compress data to match git protocol compression', async () => {
//   //   const rawcontent = await io.readFileAsync('git_example/.git/objects/e2/7bb34b0807ebf1b91bb66a4c147430cde4f08f');
//   //   const compressed = pako.deflate(rawcontent, { level: 1 });
//   //   const decompressed = pako.inflate(compressed, { to: 'string' });
//   //   const recompressed = pako.deflate(decompressed, { level: 1 });
//   //   expect(recompressed).toStrictEqual(compressed);
//   // });

//   // it('Print binary buffer from file', async () => {
//   //   // const incomingPath = 'git_example/.git/objects/e2/7bb34b0807ebf1b91bb66a4c147430cde4f08f';
//   //   const incomingPath = 'git_example/.git/objects/6d/67f18060a4a86a1524a7623b9bc29712feda1c';
//   //   const targetHash = io.extractDirname(incomingPath) + io.extractFilename(incomingPath)
//   //   const binary = await git.readGitObjectToUint8Array(incomingPath);
//   //   const decoded = await git.readGitObject(incomingPath);
//   //   const hash = sha1(decoded);
//   //   process.stdout.write(`file: ${incomingPath}\nbyte array:\n[${binary}]\ndecoded:\n[${decoded}]\nSHA1 hash: ${hash}\n`);
//   //   expect(hash).toBe(targetHash);
//   //   expect(decoded).toBe(`blob 52\x00My data fits on one line\nBut another has been added\n`);
//   //   // expect(decoded).toBe(`blob 25\x00My data fits on one line\n`);
//   // });

//   // it('mimics gitter.py', async () => {
//   //   const rawcontent = await io.readFileAsync('git_example/.git/objects/e2/7bb34b0807ebf1b91bb66a4c147430cde4f08f');
//   //   const compressedContents = pako.deflate(rawcontent, { level: 1 });
//   //   const decompressedContents = pako.inflate(compressedContents, { to: 'string' });
//   //   const recompressedContents = pako.deflate(decompressedContents, { level: 1 });
//   //   expect(recompressedContents).toStrictEqual(new Uint8Array(compressedContents));
//   // });

// });
