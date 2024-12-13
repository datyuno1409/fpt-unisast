import {
	faCloudArrowUp,
	faFileZipper,
	faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface ScanResult {
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
	old_fingerprint: string;
	parent_line_number: number;
	sink: {
		column: { end: number; start: number };
		content: string;
		end: number;
		start: number;
	};
	source: {
		column: { end: number; start: number };
		end: number;
		start: number;
	};
	title: string;
}

interface ScanResponse {
	status: string;
	results: {
		data: {
			bearer: {
				critical: ScanResult[];
				high: ScanResult[];
				medium: ScanResult[];
				low: ScanResult[];
			};
			semgrep: {
				errors: unknown[];
				paths?: {
					scanned: string[];
				};
				results: Array<{
					check_id: string;
					path: string;
					start: { line: number; col: number };
					end: { line: number; col: number };
					extra: {
						lines: string;
						message: string;
						severity: string;
						metadata: {
							cwe: string[];
							owasp: string[];
							references?: string[];
						};
					};
				}>;
			};
		};
		error: null | string;
		success: boolean;
	};
}

const cleanPaths = (obj: unknown): unknown => {
	if (typeof obj === 'string') {
		return obj.replace(/.*tmp\/fpt_scan\/|.*tmp\//g, '');
	}

	if (Array.isArray(obj)) {
		return obj.map((item) => cleanPaths(item));
	}

	if (obj && typeof obj === 'object') {
		const cleaned: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(
			obj as Record<string, unknown>,
		)) {
			cleaned[key] = cleanPaths(value);
		}
		return cleaned;
	}

	return obj;
};

const cleanScanResults = (data: ScanResponse): ScanResponse => {
	const clonedData = JSON.parse(JSON.stringify(data));
	return cleanPaths(clonedData) as ScanResponse;
};

const Scan: React.FC = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [file, setFile] = useState<File | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [scanProgress, setScanProgress] = useState(0);
	const [scanStage, setScanStage] = useState<
		'initial' | 'analyzing' | 'finalizing'
	>('initial');

	const { getRootProps, getInputProps, isDragActive, fileRejections } =
		useDropzone({
			onDrop: (acceptedFiles: File[]) => {
				if (acceptedFiles.length > 0) {
					setFile(acceptedFiles[0]);
				}
			},
			onDropRejected: () => {
				setFile(null);
			},
			accept: {
				'application/zip': ['.zip'],
			},
			maxFiles: 1,
			multiple: false,
			maxSize: 20 * 1024 * 1024,
		});

	const getErrorMessage = () => {
		if (fileRejections.length > 0) {
			const { errors } = fileRejections[0];
			if (errors[0]?.code === 'file-too-large') {
				return 'File quá lớn. Vui lòng tải lên file nh hơn 20MB';
			}
			if (errors[0]?.code === 'file-invalid-type') {
				return 'Chỉ chấp nhận file ZIP';
			}
			return 'File không hợp lệ';
		}
		return null;
	};

	const startLoading = async () => {
		for (let i = 0; i <= 70; i += 2) {
			setScanProgress(i);
			await new Promise((resolve) => setTimeout(resolve, 50));
		}

		setScanStage('analyzing');
		await new Promise((resolve) => setTimeout(resolve, 2000));
		for (let i = 72; i <= 90; i += 2) {
			setScanProgress(i);
			await new Promise((resolve) => setTimeout(resolve, 50));
		}

		setScanStage('finalizing');
	};

	const handleSubmit = async () => {
		setIsLoading(true);
		setScanProgress(0);
		setScanStage('initial');

		try {
			startLoading();
			if (!file) return;
			const formData = new FormData();
			formData.append('file', file);
			const response = await axios.post<ScanResponse>(
				'/api/scan',
				formData,
				{
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				},
			);

			const cleanedResponse = cleanScanResults(response.data);
			const scanId = crypto.randomUUID();
			const existingResults = localStorage.getItem('scanResults');
			const results = existingResults ? JSON.parse(existingResults) : {};
			results[scanId] = cleanedResponse;
			localStorage.setItem('scanResults', JSON.stringify(results));
			setScanProgress(100);
			await new Promise((resolve) => setTimeout(resolve, 500));
			toast.success('Quét mã nguồn thành công!');
			navigate(`/history/${scanId}`);
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const message =
					error.response?.data?.message ||
					'Quét thất bại. Vui lòng thử lại.';
				toast.error(message);
			} else {
				toast.error('Có lỗi xảy ra. Vui lòng thử lại sau.');
			}
		} finally {
			setIsLoading(false);
			setScanProgress(0);
			setScanStage('initial');
		}
	};

	const getScanMessage = () => {
		switch (scanStage) {
			case 'analyzing':
				return 'Đang phân tích mã nguồn chi tiết...';
			case 'finalizing':
				return 'Đang hoàn thiện báo cáo...';
			default:
				return 'Đang quét mã nguồn của bạn...';
		}
	};

	useEffect(() => {
		let isSubscribed = true;

		const autoScan = async () => {
			if (searchParams.get('rescan') === 'true') {
				setIsLoading(true);
				setScanProgress(0);
				setScanStage('initial');

				try {
					startLoading();
					const response =
						await axios.post<ScanResponse>('/api/rescan');

					if (!isSubscribed) return;

					const cleanedResponse = cleanScanResults(response.data);
					const scanId = crypto.randomUUID();
					const existingResults = localStorage.getItem('scanResults');
					const results = existingResults
						? JSON.parse(existingResults)
						: {};
					results[scanId] = cleanedResponse;
					localStorage.setItem(
						'scanResults',
						JSON.stringify(results),
					);
					setScanProgress(100);
					await new Promise((resolve) => setTimeout(resolve, 500));
					toast.success('Quét mã nguồn thành công!');
					navigate(`/history/${scanId}`);
				} catch (error) {
					if (!isSubscribed) return;

					if (axios.isAxiosError(error)) {
						const message =
							error.response?.data?.message ||
							'Quét thất bại. Vui lòng thử lại.';
						toast.error(message);
					} else {
						toast.error('Có lỗi xảy ra. Vui lòng thử lại sau.');
					}
				} finally {
					setIsLoading(false);
					setScanProgress(0);
					setScanStage('initial');
				}
			}
		};

		autoScan();

		return () => {
			isSubscribed = false;
		};
	}, [searchParams, navigate]);

	return (
		<>
			<Helmet>
				<title>Quét Mã Nguồn - FPT UniSAST</title>
			</Helmet>
			<div className='min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-white px-8 py-12'>
				<div className='mx-auto max-w-4xl'>
					<div className='text-center'>
						<h1 className='text-4xl font-bold text-gray-900'>
							Quét Mã Nguồn
						</h1>
						<p className='mt-4 text-lg text-gray-600'>
							{searchParams.get('rescan') === 'true'
								? 'Đang quét lại mã nguồn...'
								: 'Tải lên file ZIP chứa mã nguồn của bạn để bắt đầu quá trình phân tích bảo mật'}
						</p>
					</div>

					<div className='mt-12'>
						{searchParams.get('rescan') !== 'true' && (
							<>
								{!file ? (
									<div
										{...getRootProps()}
										className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed p-12 text-center transition-all duration-300 ${
											isDragActive
												? 'border-gray-400 bg-gray-50'
												: 'border-gray-300 bg-white/50 backdrop-blur-sm hover:border-gray-400 hover:bg-white/80'
										}`}
									>
										<input {...getInputProps()} />
										<div className='space-y-4'>
											<FontAwesomeIcon
												icon={faCloudArrowUp}
												className='h-12 w-12 text-gray-400 transition-transform duration-300 group-hover:scale-110 group-hover:text-gray-500'
											/>
											<div className='space-y-2'>
												<p className='text-lg font-medium text-gray-700'>
													{isDragActive
														? 'Thả file tại đây'
														: 'Click hoặc kéo thả file'}
												</p>
												<p className='text-sm text-gray-500'>
													Chỉ chấp nhận file ZIP (tối
													đa 20MB)
												</p>
											</div>
										</div>
									</div>
								) : (
									<div className='rounded-xl border border-gray-200 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl'>
										<div className='flex items-center justify-between'>
											<div className='flex items-center space-x-4'>
												<div className='rounded-lg bg-gray-50 p-3'>
													<FontAwesomeIcon
														icon={faFileZipper}
														className='h-6 w-6 text-gray-500'
													/>
												</div>
												<div>
													<p className='font-medium text-gray-900'>
														{file.name}
													</p>
													<p className='text-sm text-gray-500'>
														{(
															file.size /
															(1024 * 1024)
														).toFixed(2)}{' '}
														MB
													</p>
												</div>
											</div>
											<button
												onClick={() => setFile(null)}
												className='rounded-lg px-3 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-50'
											>
												Xóa
											</button>
										</div>
									</div>
								)}

								{getErrorMessage() && (
									<div className='mt-2 text-sm text-red-600'>
										{getErrorMessage()}
									</div>
								)}

								<div className='mt-8 flex flex-col items-center justify-center gap-4'>
									<button
										onClick={handleSubmit}
										disabled={!file || isLoading}
										className={`group relative flex items-center gap-2 overflow-hidden rounded-lg px-8 py-3 font-medium transition-all duration-300 ${
											file && !isLoading
												? 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg'
												: 'cursor-not-allowed bg-gray-300 text-gray-500'
										}`}
									>
										{isLoading ? (
											<>
												<FontAwesomeIcon
													icon={faSpinner}
													className='h-5 w-5 animate-spin'
												/>
												<span>Đang Quét...</span>
											</>
										) : (
											<span>Bắt Đầu Quét</span>
										)}
									</button>
								</div>
							</>
						)}

						{isLoading && (
							<div className='mt-8 flex flex-col items-center justify-center gap-4'>
								<div className='w-full max-w-md'>
									<div className='mb-2 flex justify-between text-sm text-gray-600'>
										<span>Tiến độ quét</span>
										<span>{scanProgress}%</span>
									</div>
									<div className='h-2 overflow-hidden rounded-full bg-gray-200'>
										<div
											className='h-full bg-gray-900 transition-all duration-300'
											style={{
												width: `${scanProgress}%`,
											}}
										/>
									</div>
									<p className='mt-2 text-center text-sm text-gray-500'>
										{getScanMessage()}
									</p>
								</div>
							</div>
						)}
					</div>

					<div className='mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2'>
						<div className='rounded-xl border border-gray-200 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl'>
							<div className='mb-4 inline-block rounded-lg bg-gray-50 p-3'>
								<FontAwesomeIcon
									icon={faCloudArrowUp}
									className='h-6 w-6 text-gray-500'
								/>
							</div>
							<h3 className='text-lg font-semibold text-gray-900'>
								Tính Năng
							</h3>
							<ul className='mt-4 space-y-3 text-gray-600'>
								<li className='flex items-center space-x-2'>
									<span className='text-gray-500'>•</span>
									<span>
										Phân tích tự động với Semgrep và Bearer
									</span>
								</li>
								<li className='flex items-center space-x-2'>
									<span className='text-gray-500'>•</span>
									<span>Phát hiện lỗi bảo mật</span>
								</li>
								<li className='flex items-center space-x-2'>
									<span className='text-gray-500'>•</span>
									<span>Đề xuất cải thiện từ AI</span>
								</li>
								<li className='flex items-center space-x-2'>
									<span className='text-gray-500'>•</span>
									<span>Báo cáo chi tiết</span>
								</li>
							</ul>
						</div>

						<div className='rounded-xl border border-gray-200 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl'>
							<div className='mb-4 inline-block rounded-lg bg-gray-50 p-3'>
								<FontAwesomeIcon
									icon={faFileZipper}
									className='h-6 w-6 text-gray-500'
								/>
							</div>
							<h3 className='text-lg font-semibold text-gray-900'>
								Yêu Cầu
							</h3>
							<ul className='mt-4 space-y-3 text-gray-600'>
								<li className='flex items-center space-x-2'>
									<span className='text-gray-500'>•</span>
									<span>File ZIP chứa mã nguồn</span>
								</li>
								<li className='flex items-center space-x-2'>
									<span className='text-gray-500'>•</span>
									<span>Kích thước tối đa 20MB</span>
								</li>
								<li className='flex items-center space-x-2'>
									<span className='text-gray-500'>•</span>
									<span>
										Hỗ trợ nhiều ngôn ngữ: Java, C++,
										Python...
									</span>
								</li>
								<li className='flex items-center space-x-2'>
									<span className='text-gray-500'>•</span>
									<span>Cấu trúc file rõ ràng</span>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default Scan;
