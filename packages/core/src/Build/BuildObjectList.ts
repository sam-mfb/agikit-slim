import { flatMap } from 'lodash';
import * as iconv from 'iconv-lite';
import { getXorEncryptionKey, xorBuffer } from '../XorEncryption';
import { ObjectList } from '../Types/ObjectList';
import { encodeUInt16LE } from '../DataEncoding';

export function buildObjectList(objectList: ObjectList, encoding: string = 'ascii'): Buffer {
  const objectNames = objectList.objects.map((object) =>
    iconv.encode(`${object.name}\0`, encoding),
  );
  const headerLength = objectList.objects.length * 3;
  let objectOffset = 0;
  const objectHeaders = flatMap(objectList.objects, (object, index) => {
    const thisObjectOffset = objectOffset;
    objectOffset += objectNames[index].byteLength;
    return [...encodeUInt16LE(thisObjectOffset + headerLength), object.startingRoomNumber];
  });
  const cleartextObjectList = Buffer.concat([
    Buffer.from([...encodeUInt16LE(headerLength), objectList.maxAnimatedObjects, ...objectHeaders]),
    ...objectNames,
  ]);
  return xorBuffer(cleartextObjectList, getXorEncryptionKey());
}
