const fs = require('fs');
const path = require('path');
const express = require('express');
const { program } = require('commander');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Налаштування multer


program
    .requiredOption('-h, --host <host>', 'Server host address')
    .requiredOption('-p, --port <port>', 'Server port number')
    .requiredOption('-c, --cache <cacheDir>', 'Cache directory path');

program.parse(process.argv);

const options = program.opts();
const host = options.host;
const port = options.port;
const cachePath = options.cache;

// Логування параметрів
console.log('Host:', host);
console.log('Port:', port);
console.log('Cache Path:', cachePath);

// Перевірка наявності параметрів
if (!host) {
    console.error('Error: Missing required argument --host');
    process.exit(1);
}
if (!port) {
    console.error('Error: Missing required argument --port');
    process.exit(1);
}
if (!cachePath) {
    console.error('Error: Missing cache directory');
    process.exit(1);
}

// Перевірка наявності каталогу
if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath, { recursive: true });
}

const server = express();

// Налаштування обробки JSON і form-urlencoded
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// GET /notes/:noteName
server.get('/notes/:noteName', (req, res) => {
    const notePath = path.join(cachePath, req.params.noteName);
    if (!fs.existsSync(notePath)) {
        res.status(404).send('Not found');
    } else {
        const noteContent = fs.readFileSync(notePath, 'utf-8');
        res.send(noteContent);
    }
});

// GET /notes
server.get('/notes', (req, res) => {
    try {
        const files = fs.readdirSync(cachePath);
        const notes = files
            .map(fileName => {
                const filePath = path.join(cachePath, fileName);
                const stats = fs.statSync(filePath);
                if (stats.isFile()) { // Перевірка, чи об'єкт є файлом
                    const content = fs.readFileSync(filePath, 'utf-8');
                    return { name: fileName, text: content };
                } else {
                    return null; // Пропустити, якщо це директорія
                }
            })
            .filter(note => note !== null); // Фільтруємо, щоб виключити `null` значення
        res.json(notes);
    } catch (err) {
        console.error('Error reading notes:', err);
        res.status(500).send('Internal server error');
    }
});

server.put('/notes/:noteName', (req, res) => {
    const notePath = path.join(cachePath, req.params.noteName);
    if (!fs.existsSync(notePath)) {
        return res.status(404).send('Not found');
    }
    const noteText = req.body.note;
    if (!noteText) {
        return res.status(400).send('Note content is required');
    }
    try {
        fs.writeFileSync(notePath, noteText);
        res.status(200).send('Note updated');
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).send('Error updating note');
    }
});

// POST /write
server.post('/write', upload.none(), (req, res) => {
    console.log(req.body);
    const { note_name, note } = req.body;
    const filePath = path.join(cachePath, note_name);
    if (fs.existsSync(filePath)) {
        return res.status(400).send('Note already exists');
    }
    fs.writeFileSync(filePath, note || '');
    res.status(201).send('Note created');
});

server.delete('/notes/:name', (req, res) => {
    const filePath = path.join(cachePath, req.params.name);
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Note Not Found');
    }
    fs.unlinkSync(filePath);
    res.send('Note deleted!');
});

// GET /UploadForm.html
server.get('/UploadForm.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'UploadForm.html'));
});

// Запуск сервера
server.listen(port, host, () => {
    console.log(`Server is running at http://${host}:${port}`);
});
