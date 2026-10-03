import * as XLSX from 'xlsx';
import type { FileResult, ParserResult } from './types';
import { mapHeaders, normalizeRows } from './normalize';

const supported = new Set(['xls', 'xlsx', 'csv']);

function extensionOf(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

function findHeaderRow(matrix: unknown[][]): number {
  let bestIndex = 0;
  let bestScore = -1;
  const maxRows = Math.min(matrix.length, 25);
  for (let i = 0; i < maxRows; i++) {
    const row = matrix[i] ?? [];
    const headers = row.map((v) => String(v ?? ''));
    const mapping = mapHeaders(headers);
    const score = Object.keys(mapping).length;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  return bestScore >= 2 ? bestIndex : 0;
}

export async function parseSpreadsheet(file: File): Promise<FileResult> {
  const extension = extensionOf(file.name);
  if (!supported.has(extension)) {
    return {
      fileName: file.name,
      extension,
      size: file.size,
      valid: false,
      records: [],
      warnings: [],
      errors: [`Format .${extension || 'unknown'} tidak didukung.`],
      sheets: [],
      detectedHeaders: [],
    };
  }

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, raw: true });
    const fileWarnings: string[] = [];
    const allRecords = [] as FileResult['records'];
    const sheets: string[] = [];
    let detectedHeaders: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      sheets.push(sheetName);
      const sheet = workbook.Sheets[sheetName];
      const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null, blankrows: false }) as unknown[][];
      if (!matrix.length) {
        fileWarnings.push(`Worksheet “${sheetName}” kosong.`);
        continue;
      }
      const headerRowIndex = findHeaderRow(matrix);
      const headerRow = (matrix[headerRowIndex] ?? []).map((v) => String(v ?? '').trim());
      if (!detectedHeaders.length) detectedHeaders = headerRow.filter(Boolean);
      const dataRows = matrix.slice(headerRowIndex + 1);
      const parsed = normalizeRows(dataRows, headerRow, file.name, sheetName, headerRowIndex);
      allRecords.push(...parsed.records);
      fileWarnings.push(...parsed.warnings.map((warning) => `${sheetName}: ${warning}`));
    }

    return {
      fileName: file.name,
      extension,
      size: file.size,
      valid: allRecords.length > 0,
      records: allRecords,
      warnings: [...new Set(fileWarnings)],
      errors: [],
      sheets,
      detectedHeaders,
    };
  } catch (error) {
    return {
      fileName: file.name,
      extension,
      size: file.size,
      valid: false,
      records: [],
      warnings: [],
      errors: [`File tidak dapat dibaca. Periksa workbook atau worksheet yang dipakai.`],
      sheets: [],
      detectedHeaders: [],
    };
  }
}

export async function parseFiles(files: File[]): Promise<ParserResult> {
  const results = await Promise.all(files.map(parseSpreadsheet));
  const validResults = results.filter((item) => item.valid);
  const dedupeMap = new Map<string, FileResult['records'][number]>();
  const fallback: FileResult['records'] = [];
  const duplicateWarnings: string[] = [];

  for (const result of results) {
    for (const record of result.records) {
      if (record.orderId && !record.orderId.startsWith('ROW-')) {
        const key = `${record.orderId.trim().toLowerCase()}|${record.productName.trim().toLowerCase()}`;
        if (dedupeMap.has(key)) {
          duplicateWarnings.push(`Duplikat dihapus: order ${record.orderId} (${record.sourceFile}).`);
          continue;
        }
        dedupeMap.set(key, record);
      } else {
        fallback.push(record);
      }
    }
  }

  const records = [...dedupeMap.values(), ...fallback];
  const warnings = [
    ...results.flatMap((item) => item.warnings),
    ...duplicateWarnings.slice(0, 12),
    ...(duplicateWarnings.length > 12 ? [`${duplicateWarnings.length - 12} duplikat lain tidak ditampilkan.`] : []),
  ];
  const errors = results.flatMap((item) => item.errors.map((error) => `${item.fileName}: ${error}`));
  return { files: results, records, warnings: [...new Set(warnings)], errors: [...new Set(errors)] };
}
