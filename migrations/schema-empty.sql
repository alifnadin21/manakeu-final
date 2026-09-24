-- For a NEW EMPTY database only. No sample users or financial records.
CREATE TABLE `approval` (
  `ID_Approval` int(11) NOT NULL,
  `ID_Nota` int(11) NOT NULL,
  `ID_Admin` int(11) NOT NULL,
  `Status_Approval` enum('Approved','Rejected') NOT NULL,
  `Tanggal_Approval` date NOT NULL,
  `Catatan` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `log_aktivitas` (
  `ID_Log` int(11) NOT NULL,
  `ID_User` int(11) NOT NULL,
  `Aksi` text NOT NULL,
  `Tanggal_Aksi` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `nota` (
  `ID_Nota` int(11) NOT NULL,
  `ID_Transaksi` int(11) NOT NULL,
  `ID_User` int(11) NOT NULL,
  `File_Nota` varchar(255) NOT NULL,
  `Status_Verifikasi` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `Tanggal_Unggah` date NOT NULL,
  `Tanggal_Verifikasi` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `project` (
  `ID_Project` int(11) NOT NULL,
  `ID_User` int(11) NOT NULL,
  `Nama_Project` varchar(255) NOT NULL,
  `Deskripsi` text DEFAULT NULL,
  `Tanggal_Mulai` date DEFAULT NULL,
  `Tanggal_Selesai` date DEFAULT NULL,
  `Status` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `transaksi` (
  `ID_Transaksi` int(11) NOT NULL,
  `ID_Project` int(11) NOT NULL,
  `ID_User` int(11) NOT NULL,
  `Jenis_Transaksi` enum('Pemasukan','Pengeluaran') NOT NULL,
  `Jumlah` decimal(15,2) NOT NULL,
  `Tanggal_Transaksi` date NOT NULL,
  `Keterangan` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `user` (
  `ID_User` int(11) NOT NULL,
  `Nama` varchar(255) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Role` enum('Admin','User') NOT NULL,
  `Password` varchar(255) NOT NULL,
  `Status` enum('Active','Inactive') NOT NULL,
  `Tanggal_Buat` date NOT NULL DEFAULT curdate(),
  `Update_user` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `approval`
  ADD PRIMARY KEY (`ID_Approval`),
  ADD KEY `ID_Nota` (`ID_Nota`),
  ADD KEY `ID_Admin` (`ID_Admin`);

ALTER TABLE `log_aktivitas`
  ADD PRIMARY KEY (`ID_Log`),
  ADD KEY `ID_User` (`ID_User`);

ALTER TABLE `nota`
  ADD PRIMARY KEY (`ID_Nota`),
  ADD KEY `ID_Transaksi` (`ID_Transaksi`);

ALTER TABLE `project`
  ADD PRIMARY KEY (`ID_Project`);

ALTER TABLE `transaksi`
  ADD PRIMARY KEY (`ID_Transaksi`),
  ADD KEY `ID_Project` (`ID_Project`);

ALTER TABLE `user`
  ADD PRIMARY KEY (`ID_User`),
  ADD UNIQUE KEY `Email` (`Email`);

ALTER TABLE `approval`
  MODIFY `ID_Approval` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

ALTER TABLE `log_aktivitas`
  MODIFY `ID_Log` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

ALTER TABLE `nota`
  MODIFY `ID_Nota` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

ALTER TABLE `project`
  MODIFY `ID_Project` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

ALTER TABLE `transaksi`
  MODIFY `ID_Transaksi` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

ALTER TABLE `user`
  MODIFY `ID_User` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

ALTER TABLE `approval`
  ADD CONSTRAINT `approval_ibfk_1` FOREIGN KEY (`ID_Nota`) REFERENCES `nota` (`ID_Nota`) ON DELETE CASCADE,
  ADD CONSTRAINT `approval_ibfk_2` FOREIGN KEY (`ID_Admin`) REFERENCES `user` (`ID_User`) ON DELETE CASCADE;

ALTER TABLE `log_aktivitas`
  ADD CONSTRAINT `log_aktivitas_ibfk_1` FOREIGN KEY (`ID_User`) REFERENCES `user` (`ID_User`) ON DELETE CASCADE;

ALTER TABLE `nota`
  ADD CONSTRAINT `nota_ibfk_1` FOREIGN KEY (`ID_Transaksi`) REFERENCES `transaksi` (`ID_Transaksi`) ON DELETE CASCADE;

ALTER TABLE `transaksi`
  ADD CONSTRAINT `transaksi_ibfk_1` FOREIGN KEY (`ID_Project`) REFERENCES `project` (`ID_Project`) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS Payments (
  ID_Payment INT AUTO_INCREMENT PRIMARY KEY,
  ID_Transaksi INT NOT NULL,
  Order_ID VARCHAR(100) NOT NULL UNIQUE,
  Payment_Method VARCHAR(50) NOT NULL,
  Amount DECIMAL(15, 2) NOT NULL,
  Status VARCHAR(50) NOT NULL DEFAULT 'pending',
  Payment_Token VARCHAR(255),
  Payment_URL VARCHAR(255),
  Created_At DATETIME NOT NULL,
  Updated_At DATETIME NOT NULL,
  FOREIGN KEY (ID_Transaksi) REFERENCES transaksi(ID_Transaksi) ON DELETE CASCADE,
  INDEX (Order_ID),
  INDEX (Status)
);

-- Apply once to the existing database, after taking a backup.
ALTER TABLE user ADD COLUMN API_Key CHAR(64) NULL;
CREATE INDEX idx_project_owner ON project (ID_User);
CREATE INDEX idx_transaction_owner_date ON transaksi (ID_User, Tanggal_Transaksi);
CREATE INDEX idx_transaction_project_date ON transaksi (ID_Project, Tanggal_Transaksi);
CREATE INDEX idx_nota_owner_status ON nota (ID_User, Status_Verifikasi);
CREATE INDEX idx_log_owner_date ON log_aktivitas (ID_User, Tanggal_Aksi);


