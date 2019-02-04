const GIFEncoder = require('gifencoder');
const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

async function start() {
    let p = process.argv.slice(2).join(' ');
    if (!p) throw new Error('No path was specified.');

    p = path.resolve(p);

    let files = fs.readdirSync(p);
    files = files.filter(f => f.endsWith('.png')).map(f => path.join(p, f));

    console.log('Loading first frame for dimensions...');
    let first = await Jimp.read(files[0]);
    let height = first.bitmap.height;
    let width = first.bitmap.width;
    console.log('First frame is', width + 'x' + height);

    console.log('Generating a gif from all the pngs in', p, '(' + files.length + ' frames)');
    let encoder = new GIFEncoder(width, height);
    encoder.createReadStream().pipe(fs.createWriteStream(path.join(p, 'output.gif')));
    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(33);
    encoder.setQuality(10);
    // encoder.setTransparent(0x000000);
    let i = 1;

    let base = new Jimp(width, height);
    base.background(0x00000000);

    for (const frame of files) {
        process.stdout.write('\rFrame ' + i++ + '/' + files.length);
        let temp = base.clone();
        let f = await Jimp.read(frame);
        f.scaleToFit(width, height, Jimp.RESIZE_NEAREST_NEIGHBOR);
        temp.composite(f, 0, 0);
        encoder.addFrame(temp.bitmap.data);
    }
    process.stdout.write('\n');
    encoder.finish();
}

start().then(() => {
    console.log('Finished!');
}).catch(err => {
    console.error(err);
});