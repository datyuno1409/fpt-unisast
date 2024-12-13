import { faClockRotateLeft, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ConfirmModal } from '../components/confirm-modal';

interface DataFlowLocation {
	start: { col: number; line: number; offset: number };
	end: { col: number; line: number; offset: number };
	path?: string;
}

interface DataFlowTrace {
	intermediate_vars?: Array<{
		content: string;
		location: DataFlowLocation;
	}>;
	taint_sink?: [string, [DataFlowLocation, string]];
	taint_source?: [string, [DataFlowLocation, string]];
}

interface VulnerabilityMetadata {
	category: string;
	confidence: string;
	cwe: string[];
	impact: string;
	likelihood: string;
	owasp: string[];
	references: string[];
	technology: string[];
	vulnerability_class: string[];
	asvs?: {
		control_id: string;
		control_url: string;
		section: string;
		version: string;
	};
}

interface SemgrepResult {
	check_id: string;
	path: string;
	start: { line: number; col: number };
	end: { line: number; col: number };
	extra: {
		dataflow_trace?: DataFlowTrace;
		lines: string;
		message: string;
		severity: string;
		metadata: VulnerabilityMetadata;
	};
}
interface BearerResults {
	critical?: { length: number }[];
	high?: { length: number }[];
	medium?: { length: number }[];
	low?: { length: number }[];
}

interface ScanResult {
	status: string;
	results: {
		semgrep?: {
			results?: SemgrepResult[];
		};
		bearer?: BearerResults;
	};
}

const ITEMS_PER_PAGE = 10;

const History: React.FC = () => {
	const [showDetails, setShowDetails] = useState(false);
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const [currentPage, setCurrentPage] = useState(1);
	const [isModalOpen, setIsModalOpen] = useState(false);

	useEffect(() => {
		setShowDetails(!!id);
	}, [id, location.pathname]);

	const getScanHistory = useCallback(() => {
		const results = localStorage.getItem('scanResults');
		if (!results) return [];

		return Object.entries(JSON.parse(results) as Record<string, ScanResult>)
			.map(([id, data]) => {
				const semgrepResults = data.results?.semgrep?.results || [];

				const semgrepErrors = semgrepResults.filter(
					(r) => r?.extra?.severity === 'ERROR',
				).length;
				const semgrepWarnings = semgrepResults.filter(
					(r) => r?.extra?.severity === 'WARNING',
				).length;

				const bearerResults = data.results?.bearer || {};
				const bearerCritical = bearerResults?.critical?.length ?? 0;
				const bearerHigh = bearerResults?.high?.length ?? 0;
				const bearerMedium = bearerResults?.medium?.length ?? 0;
				const bearerLow = bearerResults?.low?.length ?? 0;

				const criticalIssues =
					semgrepErrors + bearerCritical + bearerHigh;

				const totalIssues =
					semgrepErrors +
					semgrepWarnings +
					bearerCritical +
					bearerHigh +
					bearerMedium +
					bearerLow;
				return {
					id,
					data,
					timestamp: id.split('-')[0],
					totalIssues,
					criticalIssues,
					semgrepErrors,
					semgrepWarnings,
					bearerCritical,
					bearerHigh,
					bearerMedium,
					bearerLow,
				};
			})
			.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
	}, []);

	const [scanHistory, setScanHistory] = useState(() => getScanHistory());

	useEffect(() => {
		setScanHistory(getScanHistory());
	}, [getScanHistory, location.key]);

	const handleDelete = useCallback(
		(scanId: string, e: React.MouseEvent) => {
			e.stopPropagation();
			if (window.confirm('Bạn có chắc chắn muốn xóa kết quả quét này?')) {
				const results = localStorage.getItem('scanResults');
				if (results) {
					const parsed = JSON.parse(results);
					delete parsed[scanId];
					localStorage.setItem('scanResults', JSON.stringify(parsed));
					setScanHistory(getScanHistory());
				}
			}
		},
		[getScanHistory],
	);

	const handleClearAll = useCallback(() => {
		localStorage.clear();
		setScanHistory([]);
		setIsModalOpen(false);
	}, []);

	const renderSeverityBadge = (total: number, critical: number) => {
		if (critical > 0) {
			return (
				<div className='flex items-center gap-2'>
					<span className='rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700'>
						{critical} Nghiêm trọng
					</span>
					<span className='rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700'>
						{total} Vấn đề
					</span>
				</div>
			);
		}
		return (
			<span className='rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700'>
				{total} Vấn đề
			</span>
		);
	};

	const totalPages = Math.ceil(scanHistory.length / ITEMS_PER_PAGE);
	const paginatedHistory = scanHistory.slice(
		(currentPage - 1) * ITEMS_PER_PAGE,
		currentPage * ITEMS_PER_PAGE,
	);

	return showDetails ? (
		<Outlet />
	) : (
		<>
			<Helmet>
				<title>Lịch Sử Quét - FPT UniSAST</title>
			</Helmet>

			<ConfirmModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onConfirm={handleClearAll}
				title="Xóa tất cả lịch sử?"
				message="Bạn có chắc chắn muốn xóa tất cả lịch sử quét? Hành động này không thể hoàn tác."
			/>

			<div className='min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-white px-8 py-12'>
				<div className='mx-auto max-w-6xl'>
					<div className='relative mb-12'>
						<div className='sticky top-4 z-10 mb-4 flex justify-end'>
							{scanHistory.length > 0 && (
								<button
									onClick={() => setIsModalOpen(true)}
									className='group flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-red-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
								>
									<FontAwesomeIcon
										icon={faTrash}
										className='h-4 w-4 transition-transform group-hover:scale-110'
									/>
									Xóa Tất Cả
								</button>
							)}
						</div>

						<div className='text-center'>
							<h1 className='text-4xl font-bold text-gray-900 sm:text-5xl'>
								Lịch Sử Quét
							</h1>
							<p className='mt-4 text-lg text-gray-600'>
								Xem lại các kết quả quét mã nguồn trước đây
							</p>
						</div>
					</div>

					{scanHistory.length === 0 ? (
						<div className='rounded-xl border border-gray-200 bg-white p-12 text-center'>
							<FontAwesomeIcon
								icon={faClockRotateLeft}
								className='h-12 w-12 text-gray-400'
							/>
							<h2 className='mt-4 text-lg font-medium text-gray-900'>
								Chưa có lịch sử quét
							</h2>
							<p className='mt-2 text-gray-500'>
								Bắt đầu quét mã nguồn để xem kết quả tại đây
							</p>
							<button
								onClick={() => navigate('/scan')}
								className='mt-6 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gray-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2'
							>
								Quét Ngay
							</button>
						</div>
					) : (
						<div className='grid grid-cols-1 gap-4'>
							{paginatedHistory.map((scan) => (
								<div
									key={scan.id}
									onClick={() =>
										navigate(`/history/${scan.id}`)
									}
									className='group cursor-pointer rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all focus-within:border-gray-300 focus-within:ring-2 focus-within:ring-gray-900 focus-within:ring-offset-2 hover:border-gray-300 hover:shadow-md'
								>
									<div className='flex items-center justify-between'>
										<div className='space-y-1'>
											<p className='text-sm text-gray-500 group-hover:text-gray-700'>
												ID: {scan.id}
											</p>
											{renderSeverityBadge(
												scan.totalIssues,
												scan.criticalIssues,
											)}
										</div>
										<div className='flex items-center gap-4'>
											<button
												onClick={(e) =>
													handleDelete(scan.id, e)
												}
												className='rounded-full p-2 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
												title='Xóa kết quả quét'
											>
												<FontAwesomeIcon
													icon={faTrash}
													className='h-4 w-4'
												/>
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}

					{scanHistory.length > ITEMS_PER_PAGE && (
						<div className='mt-8 flex justify-center gap-2'>
							{Array.from(
								{ length: totalPages },
								(_, i) => i + 1,
							).map((page) => (
								<button
									key={page}
									onClick={() => setCurrentPage(page)}
									className={`rounded-lg px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${
										currentPage === page
											? 'bg-gray-900 text-white hover:bg-gray-800'
											: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
									}`}
								>
									{page}
								</button>
							))}
						</div>
					)}
				</div>
			</div>
		</>
	);
};

export default History;
