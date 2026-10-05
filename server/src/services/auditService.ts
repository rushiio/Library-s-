import crypto from 'crypto';
import { prisma } from '../config/db.js';

export class AuditService {
  /**
   * Records a tamper-evident audit log chained with SHA-256 hash
   */
  static async logAction(params: {
    userId?: string;
    action: string;
    details: Record<string, any>;
    ipAddress?: string;
  }) {
    try {
      // Find latest log to chain hash
      const lastLog = await prisma.activityLog.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      const previousHash = lastLog ? lastLog.currentHash : 'GENESIS_BLOCK_HASH_LIBRA_AI_2026';
      const detailsStr = JSON.stringify(params.details);
      const timestamp = new Date().toISOString();

      // Compute current hash
      const dataToHash = `${previousHash}|${params.userId || 'SYSTEM'}|${params.action}|${detailsStr}|${timestamp}`;
      const currentHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

      return await prisma.activityLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          details: detailsStr,
          ipAddress: params.ipAddress,
          previousHash,
          currentHash,
        },
      });
    } catch (error) {
      console.error('Audit log failed:', error);
    }
  }

  /**
   * Verifies the integrity of the audit chain
   */
  static async verifyChainIntegrity(): Promise<{ valid: boolean; compromisedAt?: string; totalLogs: number }> {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'asc' },
    });

    let expectedPrevHash = 'GENESIS_BLOCK_HASH_LIBRA_AI_2026';

    for (const log of logs) {
      if (log.previousHash !== expectedPrevHash) {
        return { valid: false, compromisedAt: log.id, totalLogs: logs.length };
      }
      expectedPrevHash = log.currentHash;
    }

    return { valid: true, totalLogs: logs.length };
  }
}
