-- Apply once to the existing database, after taking a backup.
ALTER TABLE user ADD COLUMN API_Key CHAR(64) NULL;
CREATE INDEX idx_project_owner ON project (ID_User);
CREATE INDEX idx_transaction_owner_date ON transaksi (ID_User, Tanggal_Transaksi);
CREATE INDEX idx_transaction_project_date ON transaksi (ID_Project, Tanggal_Transaksi);
CREATE INDEX idx_nota_owner_status ON nota (ID_User, Status_Verifikasi);
CREATE INDEX idx_log_owner_date ON log_aktivitas (ID_User, Tanggal_Aksi);

