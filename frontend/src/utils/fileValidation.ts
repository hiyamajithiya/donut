export interface FileValidationRule {
  maxSize?: number; // in bytes
  maxFiles?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class FileValidator {
  private rules: FileValidationRule;

  constructor(rules: FileValidationRule = {}) {
    this.rules = rules;
  }

  validateFiles(files: FileList | File[]): FileValidationResult {
    const fileArray = Array.from(files);
    const result: FileValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check file count
    if (this.rules.maxFiles && fileArray.length > this.rules.maxFiles) {
      result.isValid = false;
      result.errors.push(`Maximum ${this.rules.maxFiles} files allowed. You selected ${fileArray.length} files.`);
    }

    // Validate each file
    fileArray.forEach((file, index) => {
      const fileResult = this.validateSingleFile(file);
      if (!fileResult.isValid) {
        result.isValid = false;
        fileResult.errors.forEach(error => {
          result.errors.push(`File ${index + 1} (${file.name}): ${error}`);
        });
      }
      fileResult.warnings.forEach(warning => {
        result.warnings.push(`File ${index + 1} (${file.name}): ${warning}`);
      });
    });

    return result;
  }

  validateSingleFile(file: File): FileValidationResult {
    const result: FileValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check file size
    if (this.rules.maxSize && file.size > this.rules.maxSize) {
      result.isValid = false;
      result.errors.push(
        `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(this.rules.maxSize)})`
      );
    }

    // Check file type
    if (this.rules.allowedTypes && !this.rules.allowedTypes.includes(file.type)) {
      result.isValid = false;
      result.errors.push(`File type "${file.type}" is not allowed. Allowed types: ${this.rules.allowedTypes.join(', ')}`);
    }

    // Check file extension
    if (this.rules.allowedExtensions) {
      const extension = this.getFileExtension(file.name);
      if (!this.rules.allowedExtensions.includes(extension)) {
        result.isValid = false;
        result.errors.push(`File extension "${extension}" is not allowed. Allowed extensions: ${this.rules.allowedExtensions.join(', ')}`);
      }
    }

    // Check if file appears to be corrupted
    if (file.size === 0) {
      result.isValid = false;
      result.errors.push('File appears to be empty or corrupted');
    }

    // Warning for large files (even if within limits)
    if (this.rules.maxSize && file.size > this.rules.maxSize * 0.8) {
      result.warnings.push('File is quite large and may take longer to process');
    }

    return result;
  }

  async validateImageDimensions(file: File): Promise<FileValidationResult> {
    const result: FileValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (!file.type.startsWith('image/')) {
      return result; // Skip dimension validation for non-images
    }

    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        // Check minimum dimensions
        if (this.rules.minWidth && img.width < this.rules.minWidth) {
          result.isValid = false;
          result.errors.push(`Image width (${img.width}px) is below minimum required width (${this.rules.minWidth}px)`);
        }

        if (this.rules.minHeight && img.height < this.rules.minHeight) {
          result.isValid = false;
          result.errors.push(`Image height (${img.height}px) is below minimum required height (${this.rules.minHeight}px)`);
        }

        // Check maximum dimensions
        if (this.rules.maxWidth && img.width > this.rules.maxWidth) {
          result.isValid = false;
          result.errors.push(`Image width (${img.width}px) exceeds maximum allowed width (${this.rules.maxWidth}px)`);
        }

        if (this.rules.maxHeight && img.height > this.rules.maxHeight) {
          result.isValid = false;
          result.errors.push(`Image height (${img.height}px) exceeds maximum allowed height (${this.rules.maxHeight}px)`);
        }

        resolve(result);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        result.isValid = false;
        result.errors.push('Invalid or corrupted image file');
        resolve(result);
      };

      img.src = url;
    });
  }

  private getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Predefined validation rules for common scenarios
export const fileValidationRules = {
  // Document validation
  documents: {
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 50,
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/tiff'
    ],
    allowedExtensions: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'tiff', 'tif']
  },

  // Image validation
  images: {
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 20,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'tiff', 'tif'],
    minWidth: 100,
    minHeight: 100,
    maxWidth: 4096,
    maxHeight: 4096
  },

  // Profile picture validation
  avatar: {
    maxSize: 2 * 1024 * 1024, // 2MB
    maxFiles: 1,
    allowedTypes: ['image/jpeg', 'image/png'],
    allowedExtensions: ['jpg', 'jpeg', 'png'],
    minWidth: 100,
    minHeight: 100,
    maxWidth: 1024,
    maxHeight: 1024
  },

  // CSV/Excel files
  spreadsheet: {
    maxSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 10,
    allowedTypes: [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    allowedExtensions: ['csv', 'xls', 'xlsx']
  }
};

// Security checks
export const performSecurityChecks = (file: File): { isSecure: boolean; issues: string[] } => {
  const issues: string[] = [];
  let isSecure = true;

  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.com$/i,
    /\.pif$/i,
    /\.vbs$/i,
    /\.js$/i,
    /\.jar$/i,
    /\.zip$/i,
    /\.rar$/i,
    /\.\./,
    /[<>:"|?*]/
  ];

  suspiciousPatterns.forEach(pattern => {
    if (pattern.test(file.name)) {
      isSecure = false;
      issues.push(`Suspicious file name pattern detected: ${file.name}`);
    }
  });

  // Check file size anomalies
  if (file.size > 100 * 1024 * 1024) { // 100MB
    issues.push('File is unusually large');
  }

  // Check for null bytes (potential security issue)
  if (file.name.includes('\0')) {
    isSecure = false;
    issues.push('File name contains null bytes');
  }

  return { isSecure, issues };
};

// Utility function to sanitize file names
export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[<>:"|?*]/g, '') // Remove dangerous characters
    .replace(/\.\./g, '') // Remove directory traversal attempts
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .toLowerCase()
    .slice(0, 255); // Limit length
};