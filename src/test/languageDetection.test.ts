import assert from 'assert';
import { getLanguageFromTitle, getFileNameFromTitle } from '../languageDetection';

suite('Language Detection Tests', () => {
    test('should detect JavaScript from .js extension', () => {
        const language = getLanguageFromTitle('script.js');
        assert.strictEqual(language, 'javascript', 'Should detect JavaScript');
    });

    test('should detect TypeScript from .ts extension', () => {
        const language = getLanguageFromTitle('script.ts');
        assert.strictEqual(language, 'typescript', 'Should detect TypeScript');
    });

    test('should detect Python from .py extension', () => {
        const language = getLanguageFromTitle('app.py');
        assert.strictEqual(language, 'python', 'Should detect Python');
    });

    test('should detect HTML from .html extension', () => {
        const language = getLanguageFromTitle('index.html');
        assert.strictEqual(language, 'html', 'Should detect HTML');
    });

    test('should detect CSS from .css extension', () => {
        const language = getLanguageFromTitle('style.css');
        assert.strictEqual(language, 'css', 'Should detect CSS');
    });

    test('should detect JSON from .json extension', () => {
        const language = getLanguageFromTitle('data.json');
        assert.strictEqual(language, 'json', 'Should detect JSON');
    });

    test('should detect Markdown from .md extension', () => {
        const language = getLanguageFromTitle('README.md');
        assert.strictEqual(language, 'markdown', 'Should detect Markdown');
    });

    test('should detect YAML from .yml extension', () => {
        const language = getLanguageFromTitle('config.yml');
        assert.strictEqual(language, 'yaml', 'Should detect YAML');
    });

    test('should detect YAML from .yaml extension', () => {
        const language = getLanguageFromTitle('config.yaml');
        assert.strictEqual(language, 'yaml', 'Should detect YAML');
    });

    test('should return plaintext for unknown extensions', () => {
        const language = getLanguageFromTitle('file.unknown');
        assert.strictEqual(language, 'plaintext', 'Should return plaintext for unknown extensions');
    });

    test('should return plaintext for files without extension', () => {
        const language = getLanguageFromTitle('Makefile');
        assert.strictEqual(language, 'plaintext', 'Should return plaintext for files without extension');
    });

    test('should detect Rust from .rs extension', () => {
        const language = getLanguageFromTitle('main.rs');
        assert.strictEqual(language, 'rust', 'Should detect Rust');
    });

    test('should detect Go from .go extension', () => {
        const language = getLanguageFromTitle('main.go');
        assert.strictEqual(language, 'go', 'Should detect Go');
    });

    test('should detect Java from .java extension', () => {
        const language = getLanguageFromTitle('App.java');
        assert.strictEqual(language, 'java', 'Should detect Java');
    });

    test('should detect C++ from .cpp extension', () => {
        const language = getLanguageFromTitle('app.cpp');
        assert.strictEqual(language, 'cpp', 'Should detect C++');
    });

    test('should detect Shell from .sh extension', () => {
        const language = getLanguageFromTitle('script.sh');
        assert.strictEqual(language, 'shellscript', 'Should detect Shell');
    });

    test('getFileNameFromTitle should return title as-is if it has extension', () => {
        const filename = getFileNameFromTitle('script.js');
        assert.strictEqual(filename, 'script.js', 'Should return title with extension');
    });

    test('getFileNameFromTitle should add .txt for titles without extension', () => {
        const filename = getFileNameFromTitle('mypaste');
        assert.strictEqual(filename, 'mypaste.txt', 'Should add .txt extension');
    });
});
