-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 18, 2025 at 07:04 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dbase_manakeu`
--

-- --------------------------------------------------------

--
-- Table structure for table `approval`
--

CREATE TABLE `approval` (
  `ID_Approval` int(11) NOT NULL,
  `ID_Nota` int(11) NOT NULL,
  `ID_Admin` int(11) NOT NULL,
  `Status_Approval` enum('Approved','Rejected') NOT NULL,
  `Tanggal_Approval` date NOT NULL,
  `Catatan` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `approval`
--

INSERT INTO `approval` (`ID_Approval`, `ID_Nota`, `ID_Admin`, `Status_Approval`, `Tanggal_Approval`, `Catatan`) VALUES
(7, 22, 19, 'Approved', '2024-03-26', 'Pembayaran dari client diterima'),
(9, 25, 19, 'Approved', '2025-04-15', 'Semua dokumen lengkap'),
(10, 26, 19, 'Approved', '2025-04-15', 'Semua dokumen lengkap'),
(11, 27, 19, 'Approved', '2025-04-15', 'Semua dokumen lengkap');

-- --------------------------------------------------------

--
-- Table structure for table `log_aktivitas`
--

CREATE TABLE `log_aktivitas` (
  `ID_Log` int(11) NOT NULL,
  `ID_User` int(11) NOT NULL,
  `Aksi` text NOT NULL,
  `Tanggal_Aksi` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `log_aktivitas`
--

INSERT INTO `log_aktivitas` (`ID_Log`, `ID_User`, `Aksi`, `Tanggal_Aksi`) VALUES
(1, 2, 'Membuat project baru: Website E-Commerce', '2025-03-10 22:21:23'),
(2, 4, 'User baru terdaftar dengan email admin2@test222.com', '2025-04-12 15:01:20'),
(3, 5, 'User baru terdaftar dengan email user.baru@test222.com', '2025-04-12 15:02:45'),
(4, 6, 'User baru terdaftar dengan email test@test.com', '2025-04-12 15:04:42'),
(5, 7, 'User baru terdaftar dengan email test space@test.com', '2025-04-12 15:05:06'),
(6, 8, 'User baru terdaftar dengan email test@test222.com', '2025-04-12 15:05:30'),
(7, 9, 'User baru terdaftar dengan email TEST@TEST45.COM', '2025-04-12 15:06:12'),
(8, 10, 'User baru terdaftar dengan email test@testt.com', '2025-04-12 15:09:37'),
(9, 4, 'User melakukan login', '2025-04-12 15:12:57'),
(10, 4, 'User melakukan login', '2025-04-12 15:14:07'),
(11, 11, 'User baru terdaftar dengan email test1@test.com', '2025-04-13 14:39:59'),
(12, 12, 'User baru terdaftar dengan email test2@test.com', '2025-04-13 14:40:12'),
(13, 13, 'User baru terdaftar dengan email test3@test.com', '2025-04-13 14:40:19'),
(14, 14, 'User baru terdaftar dengan email test@gmail.com', '2025-04-13 14:52:18'),
(15, 15, 'User baru terdaftar via Google: 2210511045@mahasiswa.upnvj.ac.id', '2025-04-13 16:20:04'),
(16, 15, 'User login via Google', '2025-04-13 16:20:04'),
(17, 2, 'Mengunggah nota pembayaran Design UI/UX', '2024-03-15 10:00:00'),
(18, 1, 'Menyetujui nota pembayaran Design UI/UX', '2024-03-16 11:00:00'),
(19, 2, 'Mengunggah nota pembayaran Domain dan Hosting', '2024-03-20 14:00:00'),
(20, 1, 'Menyetujui nota pembayaran Domain dan Hosting', '2024-03-21 09:00:00'),
(21, 2, 'Mengunggah nota pembayaran Tahap 1', '2024-03-25 16:00:00'),
(22, 1, 'Menyetujui nota pembayaran Tahap 1', '2024-03-26 10:00:00'),
(23, 2, 'Mengunggah nota pembayaran Frontend Developer', '2024-04-01 13:00:00'),
(24, 2, 'Mengunggah nota pembayaran Backend Developer', '2024-04-05 15:00:00'),
(25, 2, 'Mengunggah nota pembayaran Tahap 2', '2024-04-10 11:00:00'),
(26, 2, 'Melakukan Pengeluaran sebesar 2500000.00 untuk project Website E-Commerce', '2024-03-15 00:00:00'),
(27, 2, 'Melakukan Pengeluaran sebesar 1500000.00 untuk project Website E-Commerce', '2024-03-20 00:00:00'),
(28, 2, 'Melakukan Pemasukan sebesar 5000000.00 untuk project Website E-Commerce', '2024-03-25 00:00:00'),
(29, 2, 'Melakukan Pengeluaran sebesar 3000000.00 untuk project Website E-Commerce', '2024-04-01 00:00:00'),
(30, 2, 'Melakukan Pengeluaran sebesar 3500000.00 untuk project Website E-Commerce', '2024-04-05 00:00:00'),
(31, 2, 'Melakukan Pemasukan sebesar 7000000.00 untuk project Website E-Commerce', '2024-04-10 00:00:00'),
(33, 18, 'User baru terdaftar dengan email faizganteng@gmail.com', '2025-04-15 22:13:37'),
(34, 19, 'User baru terdaftar dengan email faizadmin@gmail.com', '2025-04-15 22:14:19'),
(35, 18, 'User melakukan login', '2025-04-15 22:17:54'),
(36, 18, 'Membuat transaksi Pengeluaran sebesar 2500000 untuk project ID 3', '2025-04-15 22:21:10'),
(37, 18, 'Membuat transaksi Pengeluaran sebesar 500000 untuk project ID 3', '2025-04-15 22:21:10'),
(38, 19, 'User melakukan login', '2025-04-15 22:26:09'),
(39, 19, 'Approved nota ID 25', '2025-04-15 22:29:12'),
(40, 19, 'Approved nota ID 26', '2025-04-15 22:29:12'),
(41, 19, 'Approved nota ID 27', '2025-04-15 22:29:12'),
(42, 18, 'User melakukan login', '2025-04-15 22:32:31'),
(43, 18, 'Adjustment budget transaksi ID 1 menjadi 2750000', '2025-04-15 22:33:32'),
(44, 18, 'Adjustment budget transaksi ID 2 menjadi 550000', '2025-04-15 22:33:32'),
(45, 18, 'Adjustment budget transaksi ID 4 menjadi 2750000', '2025-04-15 22:34:29'),
(46, 18, 'Adjustment budget transaksi ID 5 menjadi 550000', '2025-04-15 22:34:29'),
(47, 18, 'Transfer transaksi ID 3 dari project 3 ke project 4', '2025-04-15 22:45:15'),
(48, 18, 'Transfer transaksi ID 6 dari project 3 ke project 4', '2025-04-15 22:45:15'),
(49, 18, 'Transfer transaksi ID 7 dari project 3 ke project 4', '2025-04-15 22:45:15'),
(50, 18, 'Request revisi nota ID 20: Mohon lampirkan nota dengan format yang benar dan tanda tangan', '2025-04-15 23:10:55'),
(51, 18, 'Request revisi nota ID 21: Mohon lampirkan nota dengan format yang benar dan tanda tangan', '2025-04-15 23:10:55'),
(52, 20, 'User baru terdaftar via Google: nugrohofaiz28@gmail.com', '2025-04-18 00:01:29'),
(53, 20, 'User login via Google', '2025-04-18 00:01:29'),
(54, 20, 'User login via Google', '2025-04-18 00:08:17'),
(55, 20, 'Login via Google', '2025-04-18 00:09:10'),
(56, 20, 'Login via Google', '2025-04-18 00:09:26'),
(57, 15, 'Login via Google', '2025-04-18 00:09:47'),
(58, 15, 'Login via Google', '2025-04-18 00:11:02'),
(59, 15, 'Login via Google', '2025-04-18 00:12:43'),
(60, 15, 'Login via Google', '2025-04-18 00:13:03'),
(61, 15, 'Login via Google', '2025-04-18 00:15:47');

-- --------------------------------------------------------

--
-- Table structure for table `nota`
--

CREATE TABLE `nota` (
  `ID_Nota` int(11) NOT NULL,
  `ID_Transaksi` int(11) NOT NULL,
  `ID_User` int(11) NOT NULL,
  `File_Nota` varchar(255) NOT NULL,
  `Status_Verifikasi` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `Tanggal_Unggah` date NOT NULL,
  `Tanggal_Verifikasi` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `nota`
--

INSERT INTO `nota` (`ID_Nota`, `ID_Transaksi`, `ID_User`, `File_Nota`, `Status_Verifikasi`, `Tanggal_Unggah`, `Tanggal_Verifikasi`) VALUES
(20, 3, 18, 'nota_design_ui_ux.pdf', 'Pending', '2024-03-15', NULL),
(21, 4, 18, 'nota_domain_hosting.pdf', 'Pending', '2024-03-20', NULL),
(22, 5, 18, 'nota_pembayaran_tahap1.pdf', 'Approved', '2024-03-25', '2024-03-26'),
(23, 6, 18, 'nota_frontend_dev.pdf', 'Pending', '2024-04-01', NULL),
(24, 7, 18, 'nota_backend_dev.pdf', 'Pending', '2024-04-05', NULL),
(25, 8, 18, 'nota_pembayaran_tahap2.pdf', 'Approved', '2024-04-10', '2025-04-15'),
(26, 21, 0, 'nota_laptop.jpg', 'Approved', '2025-04-15', '2025-04-15'),
(27, 22, 0, 'nota_software.pdf', 'Approved', '2025-04-15', '2025-04-15');

-- --------------------------------------------------------

--
-- Table structure for table `project`
--

CREATE TABLE `project` (
  `ID_Project` int(11) NOT NULL,
  `ID_User` int(11) NOT NULL,
  `Nama_Project` varchar(255) NOT NULL,
  `Deskripsi` text DEFAULT NULL,
  `Tanggal_Mulai` date DEFAULT NULL,
  `Tanggal_Selesai` date DEFAULT NULL,
  `Status` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project`
--

INSERT INTO `project` (`ID_Project`, `ID_User`, `Nama_Project`, `Deskripsi`, `Tanggal_Mulai`, `Tanggal_Selesai`, `Status`) VALUES
(3, 18, 'Website E-Commerce', 'Pembuatan website e-commerce untuk UKM', '2024-03-13', '2024-06-13', 'Deactive'),
(4, 0, 'App Leterbox', 'Membuat apps mirip Lettebox', NULL, NULL, 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `transaksi`
--

CREATE TABLE `transaksi` (
  `ID_Transaksi` int(11) NOT NULL,
  `ID_Project` int(11) NOT NULL,
  `ID_User` int(11) NOT NULL,
  `Jenis_Transaksi` enum('Pemasukan','Pengeluaran') NOT NULL,
  `Jumlah` decimal(15,2) NOT NULL,
  `Tanggal_Transaksi` date NOT NULL,
  `Keterangan` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transaksi`
--

INSERT INTO `transaksi` (`ID_Transaksi`, `ID_Project`, `ID_User`, `Jenis_Transaksi`, `Jumlah`, `Tanggal_Transaksi`, `Keterangan`) VALUES
(3, 4, 4, 'Pengeluaran', 2500000.00, '2024-03-15', 'Pembayaran Design UI/UX'),
(4, 3, 18, 'Pengeluaran', 2750000.00, '2024-03-20', 'Pembelian Domain dan Hosting [Adjusted: Penyesuaian harga'),
(5, 3, 18, 'Pemasukan', 550000.00, '2024-03-25', 'Pembayaran Tahap 1 Client [Adjusted: Penambahan fitur'),
(6, 4, 18, 'Pengeluaran', 3000000.00, '2024-04-01', 'Pembayaran Frontend Developer'),
(7, 4, 18, 'Pengeluaran', 3500000.00, '2024-04-05', 'Pembayaran Backend Developer'),
(8, 3, 18, 'Pemasukan', 7000000.00, '2024-04-10', 'Pembayaran Tahap 2 Client'),
(21, 3, 18, 'Pengeluaran', 2500000.00, '2025-04-15', 'Pembelian Laptop'),
(22, 3, 18, 'Pengeluaran', 500000.00, '2025-04-15', 'Pembelian Software');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

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

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`ID_User`, `Nama`, `Email`, `Role`, `Password`, `Status`, `Tanggal_Buat`, `Update_user`) VALUES
(1, 'Admin Test', 'admin@test.com', 'Admin', '', 'Active', '2025-04-12', '2025-04-15 14:04:09'),
(2, 'User Test', 'user@gmail.com', 'User', '', 'Active', '2025-04-12', '2025-04-15 14:55:10'),
(3, 'Admin Kedua', 'admin2@test.com', 'Admin', '', 'Active', '2025-04-12', '2025-04-15 14:04:09'),
(4, 'Admin Test222', 'admin2@gmail.com', 'Admin', 'Password123222', 'Active', '2025-04-12', '2025-04-15 15:07:28'),
(5, 'User Baru222', 'user.baru@test222.com', 'User', '$2b$10$T//2sDKDw8TAtNWl6vNlAe/WyfZLkpn0ftcWtzzfyB3TGK4wCqsga', 'Active', '2025-04-12', '2025-04-15 14:04:09'),
(6, 'Test User', 'test@test.com', 'Admin', '$2b$10$kGdspJfMlms7vKdufOCXZu39KVqzgeY3yu8DeiUkVoCmHqDxb8T2O', 'Active', '2025-04-12', '2025-04-15 14:04:09'),
(7, 'Test User', 'test space@test.com', 'Admin', '$2b$10$UDHXpyzWZ2dzNYQGVGZhV.E2VThCSiQ0D8RUQZ28Cv9IzLYSmzJby', 'Active', '2025-04-12', '2025-04-15 14:04:09'),
(8, 'Test@User#123', 'test@test222.com', 'Admin', '$2b$10$w1lqtLtt.rZa9E.xtduGP.2gZhXNIED4jX1KHE2QsogaMmt/fIQWO', 'Active', '2025-04-12', '2025-04-15 14:04:09'),
(9, 'Test User', 'TEST@TEST45.COM', 'Admin', '$2b$10$7tKlbq60kri1BNYPgh4WH..SOEmr5cSlZmVk2Uh9etDURoT8nv46S', 'Active', '2025-04-12', '2025-04-15 14:04:09'),
(10, 'Test User', 'test@testt.com', 'Admin', '$2b$10$0rmOJPyQTe/wptQ6aoUtjuTU4Lp9AF9QJziDyBmEi7PCsUiZ1YXYi', 'Active', '2025-04-12', '2025-04-15 14:04:09'),
(11, 'Test User', 'test1@test.com', 'User', '$2b$10$bil2PQ3J5/M6IeZi1.dMle8AYJAb.x68EC9ncA9PgF6kUUFK2O3V6', 'Active', '2025-04-13', '2025-04-15 14:04:09'),
(12, 'Test User', 'test2@test.com', 'User', '$2b$10$x169WDwGeiaFO8Y3EPl2/.FLM.IZryw1zw8l.V40pWi.O5moBxelq', 'Active', '2025-04-13', '2025-04-15 14:04:09'),
(13, 'Test User', 'test3@test.com', 'User', '$2b$10$RKh1aydskFbUdJY3BZdFC.wh2Vlf8K0zTeRt0y4EV5PXTXTUvhCA.', 'Active', '2025-04-13', '2025-04-15 14:04:09'),
(14, 'Test User', 'test@gmail.com', 'User', '$2b$10$6rJMHCaiWDGLrlvUqQGvtONbVm0hXr4Wc1htGweZVo.McGyn5t5Ay', 'Active', '2025-04-13', '2025-04-15 14:04:09'),
(15, 'Faiz Firstian Nugroho', '2210511045@mahasiswa.upnvj.ac.id', 'User', '', 'Active', '2025-04-13', '2025-04-15 14:04:09'),
(18, 'Faiz Ganteng', 'faizganteng@gmail.com', 'User', '$2b$10$qbDPSCTZM6.ZXw.48XTTL.M8onEGF3lCrUz4.neNjuUPhYjeyCfk2', 'Active', '2025-04-15', '2025-04-15 15:13:37'),
(19, 'Faiz Admin', 'faizadmin@gmail.com', 'Admin', '$2b$10$RgCE2ihlMQ8cVb/yVRjdmOS0bobI50PqKjH9xep793JY8g.BGffkK', 'Active', '2025-04-15', '2025-04-15 15:14:19'),
(20, 'Firstian Alternative', 'nugrohofaiz28@gmail.com', 'User', '', 'Active', '2025-04-18', '2025-04-17 17:01:29');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `approval`
--
ALTER TABLE `approval`
  ADD PRIMARY KEY (`ID_Approval`),
  ADD KEY `ID_Nota` (`ID_Nota`),
  ADD KEY `ID_Admin` (`ID_Admin`);

--
-- Indexes for table `log_aktivitas`
--
ALTER TABLE `log_aktivitas`
  ADD PRIMARY KEY (`ID_Log`),
  ADD KEY `ID_User` (`ID_User`);

--
-- Indexes for table `nota`
--
ALTER TABLE `nota`
  ADD PRIMARY KEY (`ID_Nota`),
  ADD KEY `ID_Transaksi` (`ID_Transaksi`);

--
-- Indexes for table `project`
--
ALTER TABLE `project`
  ADD PRIMARY KEY (`ID_Project`);

--
-- Indexes for table `transaksi`
--
ALTER TABLE `transaksi`
  ADD PRIMARY KEY (`ID_Transaksi`),
  ADD KEY `ID_Project` (`ID_Project`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`ID_User`),
  ADD UNIQUE KEY `Email` (`Email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `approval`
--
ALTER TABLE `approval`
  MODIFY `ID_Approval` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `log_aktivitas`
--
ALTER TABLE `log_aktivitas`
  MODIFY `ID_Log` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- AUTO_INCREMENT for table `nota`
--
ALTER TABLE `nota`
  MODIFY `ID_Nota` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `project`
--
ALTER TABLE `project`
  MODIFY `ID_Project` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `transaksi`
--
ALTER TABLE `transaksi`
  MODIFY `ID_Transaksi` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `ID_User` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `approval`
--
ALTER TABLE `approval`
  ADD CONSTRAINT `approval_ibfk_1` FOREIGN KEY (`ID_Nota`) REFERENCES `nota` (`ID_Nota`) ON DELETE CASCADE,
  ADD CONSTRAINT `approval_ibfk_2` FOREIGN KEY (`ID_Admin`) REFERENCES `user` (`ID_User`) ON DELETE CASCADE;

--
-- Constraints for table `log_aktivitas`
--
ALTER TABLE `log_aktivitas`
  ADD CONSTRAINT `log_aktivitas_ibfk_1` FOREIGN KEY (`ID_User`) REFERENCES `user` (`ID_User`) ON DELETE CASCADE;

--
-- Constraints for table `nota`
--
ALTER TABLE `nota`
  ADD CONSTRAINT `nota_ibfk_1` FOREIGN KEY (`ID_Transaksi`) REFERENCES `transaksi` (`ID_Transaksi`) ON DELETE CASCADE;

--
-- Constraints for table `transaksi`
--
ALTER TABLE `transaksi`
  ADD CONSTRAINT `transaksi_ibfk_1` FOREIGN KEY (`ID_Project`) REFERENCES `project` (`ID_Project`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- Create Payments table for storing Midtrans payment data
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

-- Add payment_gateway column to Transaksi table if you want to track which gateway was used
-- ALTER TABLE Transaksi ADD COLUMN Payment_Gateway VARCHAR(50) DEFAULT NULL; 

