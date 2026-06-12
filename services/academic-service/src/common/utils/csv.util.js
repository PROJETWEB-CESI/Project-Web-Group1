const { parse } = require('csv-parse/sync');

const REQUIRED_HEADERS = ['studentId', 'evaluationName', 'score', 'coefficient', 'evaluationDate'];

// Parse un buffer CSV et retourne un tableau d'objets grades
// Format attendu : studentId,evaluationName,score,coefficient,evaluationDate
const parseGradesCsv = (buffer) => {
    const records = parse(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });

    if (records.length === 0) throw new Error('Le fichier CSV est vide');

    const missing = REQUIRED_HEADERS.filter(h => !(h in records[0]));
    if (missing.length > 0) throw new Error('Colonnes manquantes dans le CSV : ' + missing.join(', '));

    return records.map((row, i) => {
        const score = row.score === '' ? null : parseFloat(row.score);
        const coefficient = parseInt(row.coefficient);
        if (isNaN(coefficient) || coefficient <= 0) throw new Error('Ligne ' + (i + 2) + ' : coefficient invalide');
        if (score !== null && (isNaN(score) || score < 0)) throw new Error('Ligne ' + (i + 2) + ' : score invalide');
        return {
            studentId: row.studentId,
            evaluationName: row.evaluationName,
            score: score,
            coefficient: coefficient,
            evaluationDate: row.evaluationDate,
            annotation: row.annotation || null,
        };
    });
};

module.exports = { parseGradesCsv };
