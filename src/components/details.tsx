import Popup from '@/components/popup';
import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import {
	faArrowLeft,
	faCircleExclamation,
	faCode,
	faDownload,
	faShieldHalved,
	faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DOMPurify from 'dompurify';
import FileSaver from 'file-saver';
import { marked } from 'marked';
import Prism from 'prismjs';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-yaml';
import 'prismjs/themes/prism-tomorrow.css';
import { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

marked.setOptions({
	async: false,
});

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

interface BearerResult {
	category_groups: string[];
	code_extract: string;
	cwe_ids: string[];
	description: string;
	documentation_url: string;
	filename: string;
	fingerprint: string;
	full_filename: string;
	id: string;
	line_number: number;
	title: string;
}

const ResultSection: React.FC<{
	title: string;
	icon: IconDefinition;
	children: React.ReactNode;
}> = ({ title, icon, children }) => (
	<section className='space-y-4 rounded-lg border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-lg'>
		<h2 className='flex items-center gap-3 text-2xl font-bold text-gray-900'>
			<FontAwesomeIcon icon={icon} className='h-6 w-6 text-gray-700' />
			{title}
		</h2>
		{children}
	</section>
);

const BearerVulnerabilityCard: React.FC<{
	result: BearerResult;
	severity: string;
}> = ({ result, severity }) => (
	<div className='rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md'>
		<div className='flex items-start gap-3'>
			<FontAwesomeIcon
				icon={faCircleExclamation}
				className={`mt-1 h-5 w-5 ${
					severity === 'critical' ? 'text-red-500' : 'text-amber-500'
				}`}
			/>
			<div className='flex-1 space-y-4'>
				<div>
					<div className='flex items-center justify-between'>
						<h4 className='text-lg font-semibold text-gray-900'>
							{result.title}
						</h4>
						<span
							className={`rounded-full px-3 py-1 text-sm font-medium ${
								severity === 'critical'
									? 'bg-red-100 text-red-800'
									: 'bg-amber-100 text-amber-800'
							}`}
						>
							{severity.toUpperCase()}
						</span>
					</div>
					<div
						className='mt-1 text-gray-600'
						dangerouslySetInnerHTML={{
							__html: DOMPurify.sanitize(
								marked(result.description ?? '') as string,
							),
						}}
					/>
				</div>

				<div className='rounded-lg bg-gray-50 p-4'>
					<div className='flex items-center gap-2 font-medium text-gray-700'>
						<FontAwesomeIcon icon={faCode} className='h-4 w-4' />
						Đoạn mã có vấn đề:
					</div>
					<div className='mt-2 text-sm text-gray-600'>
						<span className='font-medium'>File:</span>{' '}
						{result.filename}
					</div>
					<Popup
						vulnerabilityType={
							result.category_groups?.[0]?.toLowerCase() ??
							'unknown'
						}
						file={result.filename}
						problematicCode={result.code_extract}
						vulnerabilityDescription={result.description}
					/>
					<pre className='mt-2 overflow-x-auto rounded bg-gray-800 p-3'>
						<code className='language-typescript'>
							{result.code_extract}
						</code>
					</pre>
					<p className='mt-2 text-sm text-gray-600'>
						Tại dòng {result.line_number}
					</p>
				</div>
				{result.category_groups && (
					<div>
						<h5 className='font-medium text-gray-700'>
							Nhóm danh mục:
						</h5>
						<ul className='mt-1 list-inside list-disc space-y-1 text-sm text-gray-600'>
							{result.category_groups.map((group) => (
								<li key={group}>{group}</li>
							))}
						</ul>
					</div>
				)}

				{result.cwe_ids && (
					<div>
						<h5 className='font-medium text-gray-700'>CWE IDs:</h5>
						<ul className='mt-1 list-inside list-disc space-y-1 text-sm text-gray-600'>
							{result.cwe_ids.map((cwe) => (
								<li key={cwe}>{cwe}</li>
							))}
						</ul>
					</div>
				)}

				<div>
					<h5 className='font-medium text-gray-700'>
						Tài liệu tham khảo:
					</h5>
					<a
						href={result.documentation_url}
						target='_blank'
						rel='noopener noreferrer'
						className='mt-1 text-sm text-blue-600 hover:underline'
					>
						{result.documentation_url}
					</a>
				</div>
			</div>
		</div>
	</div>
);

const VulnerabilityCard: React.FC<{ result: SemgrepResult }> = ({ result }) => (
	<div className='rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md'>
		<div className='flex items-start gap-3'>
			<FontAwesomeIcon
				icon={faCircleExclamation}
				className={`mt-1 h-5 w-5 ${
					result.extra.severity === 'ERROR'
						? 'text-red-500'
						: 'text-amber-500'
				}`}
			/>
			<div className='flex-1 space-y-4'>
				<div>
					<div className='flex items-center justify-between'>
						<h4 className='text-lg font-semibold text-gray-900'>
							{result.check_id.split('.').pop()}
						</h4>
						<span
							className={`rounded-full px-3 py-1 text-sm font-medium ${
								result.extra.severity === 'ERROR'
									? 'bg-red-100 text-red-800'
									: 'bg-amber-100 text-amber-800'
							}`}
						>
							{result.extra.severity}
						</span>
					</div>
					<p className='mt-1 text-gray-600'>{result.extra.message}</p>
				</div>

				<div className='rounded-lg bg-gray-50 p-4'>
					<div className='flex items-center gap-2 font-medium text-gray-700'>
						<FontAwesomeIcon icon={faCode} className='h-4 w-4' />
						Đoạn mã có vấn đề:
					</div>
					<div className='mt-2 text-sm text-gray-600'>
						<span className='font-medium'>File:</span> {result.path}
					</div>
					<Popup
						vulnerabilityType={
							result.check_id.split('.').pop()?.toLowerCase() ??
							'unknown'
						}
						file={result.path}
						problematicCode={result.extra.lines}
						vulnerabilityDescription={result.extra.message}
					/>
					<pre className='mt-2 overflow-x-auto rounded bg-gray-800 p-3'>
						<code className='language-typescript'>
							{result.extra.lines}
						</code>
					</pre>
					<p className='mt-2 text-sm text-gray-600'>
						Tại dòng {result.start.line}, cột {result.start.col}
					</p>
				</div>

				{result.extra.dataflow_trace && (
					<div className='rounded-lg bg-blue-50 p-4'>
						<h5 className='font-medium text-blue-900'>
							Luồng dữ liệu:
						</h5>
						<div className='mt-2 space-y-2 text-sm text-blue-800'>
							{result.extra.dataflow_trace.taint_source && (
								<div>
									<span className='font-medium'>Nguồn:</span>{' '}
									{
										result.extra.dataflow_trace
											.taint_source[1][1]
									}
								</div>
							)}
							{result.extra.dataflow_trace.taint_sink && (
								<div>
									<span className='font-medium'>Đích:</span>{' '}
									{
										result.extra.dataflow_trace
											.taint_sink[1][1]
									}
								</div>
							)}
						</div>
					</div>
				)}

				<div className='grid grid-cols-2 gap-4'>
					<div>
						<h5 className='font-medium text-gray-700'>
							Thông tin chi tiết:
						</h5>
						<ul className='mt-1 space-y-1 text-sm text-gray-600'>
							<li>
								<span className='font-medium'>
									Mức độ tin cậy:
								</span>{' '}
								{result.extra.metadata.confidence}
							</li>
							<li>
								<span className='font-medium'>Tác động:</span>{' '}
								{result.extra.metadata.impact}
							</li>
							<li>
								<span className='font-medium'>
									Khả năng xảy ra:
								</span>{' '}
								{result.extra.metadata.likelihood}
							</li>
						</ul>
					</div>

					{result.extra.metadata.asvs && (
						<div>
							<h5 className='font-medium text-gray-700'>ASVS:</h5>
							<div className='mt-1 text-sm text-gray-600'>
								<p>{result.extra.metadata.asvs.control_id}</p>
								<p>{result.extra.metadata.asvs.section}</p>
								<a
									href={
										result.extra.metadata.asvs.control_url
									}
									target='_blank'
									rel='noopener noreferrer'
									className='text-blue-600 hover:underline'
								>
									Xem chi tiết
								</a>
							</div>
						</div>
					)}
				</div>

				<div className='grid grid-cols-2 gap-4'>
					{result.extra.metadata.cwe &&
						Array.isArray(result.extra.metadata.cwe) && (
							<div>
								<h5 className='font-medium text-gray-700'>
									CWE:
								</h5>
								<ul className='mt-1 list-inside list-disc space-y-1 text-sm text-gray-600'>
									{result.extra.metadata.cwe.map((cwe) => (
										<li key={cwe}>{cwe}</li>
									))}
								</ul>
							</div>
						)}

					{result.extra.metadata.owasp &&
						Array.isArray(result.extra.metadata.owasp) && (
							<div>
								<h5 className='font-medium text-gray-700'>
									OWASP:
								</h5>
								<ul className='mt-1 list-inside list-disc space-y-1 text-sm text-gray-600'>
									{result.extra.metadata.owasp.map(
										(owasp) => (
											<li key={owasp}>{owasp}</li>
										),
									)}
								</ul>
							</div>
						)}
				</div>

				{result.extra.metadata.references &&
					Array.isArray(result.extra.metadata.references) && (
						<div>
							<h5 className='font-medium text-gray-700'>
								Tài liệu tham khảo:
							</h5>
							<ul className='mt-1 list-inside list-disc space-y-1 text-sm text-blue-600'>
								{result.extra.metadata.references.map((ref) => (
									<li key={ref}>
										<a
											href={ref}
											target='_blank'
											rel='noopener noreferrer'
											className='hover:underline'
										>
											{ref}
										</a>
									</li>
								))}
							</ul>
						</div>
					)}
			</div>
		</div>
	</div>
);

const ActionButton: React.FC<{
	onClick: () => void;
	icon: IconDefinition;
	label: string;
}> = ({ onClick, icon, label }) => (
	<button
		onClick={onClick}
		className='inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200'
	>
		<FontAwesomeIcon icon={icon} className='h-4 w-4' />
		{label}
	</button>
);

const Details: React.FC = () => {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();

	const scanResults = useMemo(() => {
		const rawData = localStorage.getItem('scanResults');
		if (!rawData) return {};
		try {
			return JSON.parse(rawData);
		} catch {
			return {};
		}
	}, []);

	const data = useMemo(() => {
		if (!id || !scanResults[id]) return null;

		const result = scanResults[id];
		return {
			status: result.status,
			results: {
				data: {
					bearer: result.results.bearer || {
						critical: [],
						high: [],
						medium: [],
						low: [],
					},
					semgrep: {
						errors: result.results.semgrep?.errors || [],
						paths: {
							scanned:
								result.results.semgrep?.paths?.scanned || [],
						},
						results: result.results.semgrep?.results || [],
					},
				},
				error: null,
				success: true,
			},
		};
	}, [id, scanResults]);

	const results = useMemo(() => {
		if (!data?.results?.data) {
			return {
				semgrep: [],
				bearer: { critical: [], high: [], medium: [], low: [] },
			};
		}

		return {
			semgrep: data.results.data.semgrep.results || [],
			bearer: data.results.data.bearer || {
				critical: [],
				high: [],
				medium: [],
				low: [],
			},
		};
	}, [data]);

	useEffect(() => {
		Prism.highlightAll();
	}, [results]);

	if (!data) {
		return <Navigate to='/history' replace />;
	}

	const downloadJson = () => {
		const blob = new Blob([JSON.stringify(data, null, 2)], {
			type: 'application/json',
		});
		FileSaver.saveAs(blob, `scan-report-${id}.json`);
	};

	const bearerResults: Record<string, BearerResult[]> = data.results?.data
		?.bearer || {
		critical: [],
		high: [],
		medium: [],
		low: [],
	};
	const semgrepResults = data.results?.data?.semgrep?.results || [];

	const totalIssues =
		Object.values(bearerResults).reduce(
			(sum, arr) => sum + (arr?.length || 0),
			0,
		) + (semgrepResults?.length || 0);

	const criticalIssues =
		(semgrepResults?.filter(
			(r: SemgrepResult) => r.extra.severity === 'ERROR',
		)?.length || 0) +
		(bearerResults.critical?.length || 0) +
		(bearerResults.high?.length || 0);

	const hasVulnerabilities =
		Object.values(bearerResults).some((arr) => arr?.length > 0) ||
		semgrepResults?.length > 0;

	return (
		<>
			<Helmet>
				<title>Kết Quả Quét | FPT UniSAST</title>
			</Helmet>
			<div className='min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-white px-8 py-12'>
				<div className='mx-auto flex max-w-7xl flex-col items-center justify-center'>
					<div className='sticky top-16 z-50 flex w-full max-w-6xl items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white bg-opacity-40 px-4 py-2 backdrop-blur-sm'>
						<button
							onClick={() => navigate('/history')}
							className='inline-flex items-center gap-2 rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900'
						>
							<FontAwesomeIcon
								icon={faArrowLeft}
								className='h-4 w-4'
							/>
							Quay lại
						</button>
					</div>

					<div className='mb-8 mt-4 flex justify-center gap-4'>
						<ActionButton
							onClick={downloadJson}
							icon={faDownload}
							label='Tải JSON'
						/>
					</div>

					<div>
						<h1 className='mb-12 text-center text-4xl font-bold text-gray-900'>
							Kết Quả Phân Tích
							{''}
							<span className='mt-2 block text-2xl font-semibold text-gray-700'>
								{' '}
								Chi Tiết Báo Cáo Bảo Mật
							</span>
						</h1>

						<div className='space-y-8'>
							<ResultSection
								title='Tổng Quan'
								icon={faShieldHalved}
							>
								<div className='grid grid-cols-2 gap-6'>
									<div className='rounded-lg bg-gray-50 p-6'>
										<h3 className='text-lg font-semibold text-gray-800'>
											Thống Kê
										</h3>
										<ul className='mt-4 space-y-3'>
											<li className='flex items-center justify-between'>
												<span className='text-gray-600'>
													Tổng số lỗ hổng:
												</span>
												<span
													className={`rounded-full px-3 py-1 text-sm font-medium ${
														hasVulnerabilities
															? 'bg-red-100 text-red-800'
															: 'bg-green-100 text-green-800'
													}`}
												>
													{totalIssues}
												</span>
											</li>
											<li className='flex items-center justify-between'>
												<span className='text-gray-600'>
													Số lỗ hổng nghiêm trọng:
												</span>
												<span className='rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800'>
													{criticalIssues}
												</span>
											</li>
											<li className='flex items-center justify-between'>
												<span className='text-gray-600'>
													Files đã quét:
												</span>
												<span className='px-3 py-1 text-gray-800'>
													{data.results.data?.semgrep
														?.paths?.scanned
														?.length ?? 0}
												</span>
											</li>
											<li className='flex items-center justify-between'>
												<span className='text-gray-600'>
													Trạng thái:
												</span>
												<span
													className={`rounded-full px-3 py-1 text-sm font-medium ${
														data.results.success
															? 'bg-green-100 text-green-800'
															: 'bg-red-100 text-red-800'
													}`}
												>
													{data.results.success
														? 'Thành công'
														: 'Thất bại'}
												</span>
											</li>
										</ul>
									</div>

									{hasVulnerabilities && (
										<div className='rounded-lg bg-amber-50 p-6'>
											<div className='flex items-center gap-2 text-amber-800'>
												<FontAwesomeIcon
													icon={faTriangleExclamation}
													className='h-5 w-5'
												/>
												<h3 className='text-lg font-semibold'>
													Cảnh Báo
												</h3>
											</div>
											<p className='mt-2 text-amber-700'>
												Phát hiện các lỗ hổng bảo mật
												tiềm ẩn. Vui lòng xem chi tiết
												bên dưới và thực hiện các biện
												pháp khắc phục.
											</p>
										</div>
									)}
								</div>
							</ResultSection>

							{hasVulnerabilities && (
								<>
									<ResultSection
										title='Báo cáo từ Bearer'
										icon={faShieldHalved}
									>
										<div className='space-y-6'>
											{results.bearer.critical?.length >
												0 && (
												<div>
													<h3 className='mb-4 text-xl font-semibold text-red-700'>
														Mức Độ Nghiêm Trọng
													</h3>
													{results.bearer.critical?.map(
														(
															result: BearerResult,
														) => (
															<BearerVulnerabilityCard
																key={
																	result.fingerprint
																}
																result={result}
																severity='critical'
															/>
														),
													)}
												</div>
											)}
											{results.bearer.high?.length >
												0 && (
												<div>
													<h3 className='mb-4 text-xl font-semibold text-orange-700'>
														Mức độ cảnh báo
													</h3>
													{results.bearer.high?.map(
														(
															result: BearerResult,
														) => (
															<BearerVulnerabilityCard
																key={
																	result.fingerprint
																}
																result={result}
																severity='high'
															/>
														),
													)}
												</div>
											)}
											{results.bearer.medium?.length >
												0 && (
												<div>
													<h3 className='mb-4 text-xl font-semibold text-yellow-700'>
														Mức Độ Trung Bình
													</h3>
													{results.bearer.medium?.map(
														(
															result: BearerResult,
														) => (
															<BearerVulnerabilityCard
																key={
																	result.fingerprint
																}
																result={result}
																severity='medium'
															/>
														),
													)}
												</div>
											)}
											{results.bearer.low?.length > 0 && (
												<div>
													<h3 className='mb-4 text-xl font-semibold text-blue-700'>
														Mức độ Nhẹ
													</h3>
													{results.bearer.low?.map(
														(
															result: BearerResult,
														) => (
															<BearerVulnerabilityCard
																key={
																	result.fingerprint
																}
																result={result}
																severity='low'
															/>
														),
													)}
												</div>
											)}
										</div>
									</ResultSection>

									<ResultSection
										title='Báo cáo từ Semgrep'
										icon={faCode}
									>
										<div className='space-y-6'>
											{results.semgrep.map(
												(result: SemgrepResult) => (
													<VulnerabilityCard
														key={`${result.check_id}-${result.path}`}
														result={result}
													/>
												),
											)}
										</div>
									</ResultSection>
								</>
							)}
						</div>

						<footer className='mt-12 text-center text-sm text-gray-600'>
							<p> FPT UniSAST.</p>
						</footer>
					</div>
				</div>
			</div>
		</>
	);
};

export default Details;
