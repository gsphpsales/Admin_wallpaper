const { tmpdir } = require('os');
const { join, dirname } = require('path');

const sharp  = require('sharp');
const fs = require('fs-extra');

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const DEF_VERSION = 9;
const DEF_THUMB_SIZE = 512;
const DEF_THUMB_SCALE = 1;

exports.getCategories = functions.https.onCall(async (_, context) => {
    const bucket = admin.storage().bucket();

    const dataSnapshots = await admin.database().ref('/categories').once('value');
    const categories = [];

    const workingDir = join(tmpdir(), 'thumbs');

    dataSnapshots.forEach(dataSnapshot => {
        const data = dataSnapshot.val();
        const key = dataSnapshot.key;
        data.key = key;
        categories.push(data);
    });

    for (let data of categories) {

        if (data._thumbnail && data._thumbnail_version === DEF_VERSION) {
            data._usingCachedImage = true;
            continue;
        }

        try {

            const fileFullPath = decodeURIComponent(data.thumbnail.match(/([^\/]*\.\w{2,4})/g).pop());
            const filePath = dirname(fileFullPath);
            const fileName = fileFullPath.split('/').pop();
            const thumbFileName = `thumb@${DEF_THUMB_SIZE}_${fileName}`
            const file = bucket.file(fileFullPath);
            const thumbFile = bucket.file(join(filePath, thumbFileName));
            const tmpFilePath = join(workingDir, `${thumbFileName}_source`);

            const [fileExists] = await file.exists();
            const [thumbExists] = await thumbFile.exists();

            if (fileExists) {
                console.log(` - Creating a new THUMB: ${thumbFileName}, ${parseInt(DEF_THUMB_SIZE * DEF_THUMB_SCALE)}`);

                await fs.ensureDir(workingDir);
                await file.download({
                    destination: tmpFilePath
                });

                const thumbPath = join(workingDir, thumbFileName);

                await sharp(tmpFilePath)
                    .resize(parseInt(DEF_THUMB_SIZE * DEF_THUMB_SCALE), parseInt(DEF_THUMB_SIZE * DEF_THUMB_SCALE))
                    .toFile(thumbPath);

                await bucket.upload(thumbPath, {
                    destination: join(filePath, thumbFileName)
                });

                await fs.remove(thumbPath);
                await fs.remove(tmpFilePath);

                data._usingCachedImage = false;
            } else {
                data._usingCachedImage = true;
            }

            data._thumbnail = data.thumbnail.replace(fileName, thumbFileName);
            data._thumbnail_version = DEF_VERSION;

            await admin.database().ref('categories').child(data.key).update(data);

        } catch (e) {

            console.log(`Can't resize image from category ${data.key}:`, e);

        }
    };

    await fs.remove(workingDir);

    return categories;
});

exports.getWallpapers = functions.https.onCall(async (data, context) => {
    const categoryName = data.category
    const bucket = admin.storage().bucket();

    const dataSnapshots = await admin.database().ref('/images')
        .child(categoryName)
        .orderByChild("indexReverse")
        .once('value');
    const wallpapers = [];

    const workingDir = join(tmpdir(), 'thumbs');

    dataSnapshots.forEach(dataSnapshot => {
        const data = dataSnapshot.val();
        const key = dataSnapshot.key;
        data.key = key;
        wallpapers.push(data);
    });

    for (let data of wallpapers) {

        if (data._thumbnail && data._thumbnail_version === DEF_VERSION) {
            data._usingCachedImage = true;
            continue;
        }

        try {

            const fileFullPath = decodeURIComponent(data.url.match(/([^\/]*\.\w{2,4})/g).pop());
            const filePath = dirname(fileFullPath);
            const fileName = fileFullPath.split('/').pop();
            const thumbFileName = `thumb@${DEF_THUMB_SIZE}_${fileName}`
            const file = bucket.file(fileFullPath);
            const thumbFile = bucket.file(join(filePath, thumbFileName));
            const tmpFilePath = join(workingDir, `${thumbFileName}_source`);

            const [fileExists] = await file.exists();
            const [thumbExists] = await thumbFile.exists();

            if (fileExists) {
                console.log(` - Creating a new THUMB: ${thumbFileName}, ${parseInt(DEF_THUMB_SIZE * DEF_THUMB_SCALE)}`);

                await fs.ensureDir(workingDir);
                await file.download({
                    destination: tmpFilePath
                });

                const thumbPath = join(workingDir, thumbFileName);

                await sharp(tmpFilePath)
                    .resize(parseInt(DEF_THUMB_SIZE * DEF_THUMB_SCALE), null)
                    .toFile(thumbPath);

                await bucket.upload(thumbPath, {
                    destination: join(filePath, thumbFileName)
                });

                await fs.remove(thumbPath);
                await fs.remove(tmpFilePath);

                data._usingCachedImage = false;
            } else {
                data._usingCachedImage = true;
            }

            data._thumbnail = data.url.replace(fileName, thumbFileName);
            data._thumbnail_version = DEF_VERSION;

            await admin.database().ref('images').child(categoryName).child(data.key).update(data);

        } catch (e) {

            console.log(`Can't resize image from wallpaper ${data.key}:`, e);

        }
    };

    await fs.remove(workingDir);

    return wallpapers;
});
