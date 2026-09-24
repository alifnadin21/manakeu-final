const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('./logger');

class PatchManagement {
    // Cek Dependencies
    static async checkDependencies() {
        try {
            const packageJson = JSON.parse(
                // Baca package.json
                await fs.readFile(
                    path.join(process.cwd(), 'package.json'),
                    'utf8'
                )
            );
            const auditResult = await this.#runCommand('npm audit --json'); // Jalankan npm audit
            const vulnerabilities = JSON.parse(auditResult);
            let packageLock; // Baca package-lock.json jika ada
            try {
                packageLock = JSON.parse(
                    await fs.readFile(
                        path.join(process.cwd(), 'package-lock.json'),
                        'utf8'
                    )
                );
            } catch (error) {
                logger.warn('package-lock.json not found');
            }
            return {
                dependencies: packageJson.dependencies,
                devDependencies: packageJson.devDependencies,
                vulnerabilities: vulnerabilities,
                lockfileExists: !!packageLock
            };
        } catch (error) {
            logger.error('Gagal Mengecek dependencies:', error);
            throw error;
        }
    }
    // Update Dependencies
    static async updateDependencies(options = { autoFix: false }) {
        try {
            const results = {
                outdated: [],
                updated: [],
                errors: []
            };
            // Cek package yang outdated
            const outdatedPackages = await this.#runCommand(
                'npm outdated --json'
            );
            results.outdated = JSON.parse(outdatedPackages);
            if (options.autoFix) {
                await this.#runCommand('npm audit fix'); // Update dependencies dengan vulnerabilities
                await this.#runCommand('npm update'); // Update ke versi minor/patch terbaru

                // Log hasil update
                const updatedPackages =
                    await this.#runCommand('npm list --json');
                results.updated = JSON.parse(updatedPackages);
            }
            return results;
        } catch (error) {
            logger.error('Gagal update dependencies:', error);
            throw error;
        }
    }

    static async #runCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error && !stdout) {
                    reject(error);
                    return;
                }
                resolve(stdout || stderr);
            });
        });
    }

    // Schedule pengecekan otomatis 4 Hari Sekali
    static scheduleChecks() {
        const WEEK_IN_MS = 4 * 24 * 60 * 60 * 1000;

        setInterval(async () => {
            try {
                logger.info('Pengecekan Dependencies');
                const checkResult = await this.checkDependencies();
                if (
                    checkResult.vulnerabilities.metadata?.vulnerabilities
                        ?.high > 0 ||
                    checkResult.vulnerabilities.metadata?.vulnerabilities
                        ?.critical > 0
                ) {
                    logger.error(
                        'Critical/High vulnerabilities:',
                        checkResult.vulnerabilities
                    );
                }
            } catch (error) {
                logger.error('Gagal Melakukan Pengecekan', error);
            }
        }, WEEK_IN_MS).unref();
    }
}

module.exports = PatchManagement;
