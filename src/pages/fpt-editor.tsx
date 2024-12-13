import { faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DiffEditor, Editor } from '@monaco-editor/react';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface FileHandle {
	getFile: () => Promise<File>;
	createWritable: () => Promise<FileSystemWritableFileStream>;
}

interface FileData {
	handle: FileHandle;
	name: string;
	path: string;
}
const languageMap = {
	ts: 'typescript',
	tsx: 'typescript',
	js: 'javascript',
	jsx: 'javascript',
	json: 'json',
	html: 'html',
	css: 'css',
	scss: 'scss',
	less: 'less',
	md: 'markdown',
	py: 'python',
	java: 'java',
	cpp: 'cpp',
	c: 'c',
	cs: 'csharp',
	go: 'go',
	rs: 'rust',
	php: 'php',
	sql: 'sql',
	yaml: 'yaml',
	yml: 'yaml',
	xml: 'xml',
	sh: 'shell',
	bash: 'shell',
	txt: 'plaintext',
} as const;
interface ApiResponse {
	status: string;
	fixed_code: string;
	message?: string;
}
const isFptScanFolder = (path: string) => path.endsWith('fpt_scan');
const FPTEditor: React.FC = () => {
	const navigate = useNavigate();
	const [content, setContent] = useState<string>('');
	const [fileHandle, setFileHandle] = useState<FileHandle | null>(null);
	const [fileName, setFileName] = useState<string>('');
	const [language, setLanguage] = useState<string>('plaintext');
	const [folderHandle, setFolderHandle] =
		useState<FileSystemDirectoryHandle | null>(null);
	const [files, setFiles] = useState<FileData[]>([]);
	const [searchParams] = useSearchParams();
	const [diffView, setDiffView] = useState(false);
	const [suggestedFix, setSuggestedFix] = useState<string>('');
	const [apiCalled, setApiCalled] = useState(false);
	const [isFileLoaded, setIsFileLoaded] = useState(false);
	const [showRescanModal, setShowRescanModal] = useState(false);

	const detectLanguage = (fileName: string): string => {
		const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
		return (
			languageMap[extension as keyof typeof languageMap] || 'plaintext'
		);
	};

	const handleOpenFolder = async () => {
		try {
			const handle = await window.showDirectoryPicker({
				mode: 'read',
				id: 'fpt-scan-folder',
				startIn: 'documents',
			});

			if (!isFptScanFolder(handle.name)) {
				toast.error('Vui lòng chỉ chọn folder có tên "fpt_scan"');
				return;
			}

			setFolderHandle(handle);

			const filesData: FileData[] = [];
			const scanFiles = async (
				handle: FileSystemDirectoryHandle,
				path = '',
			) => {
				for await (const entry of handle.values()) {
					if (entry.kind === 'file') {
						const extension =
							entry.name.split('.').pop()?.toLowerCase() ?? '';
						if (extension in languageMap) {
							filesData.push({
								handle: entry as FileHandle,
								name: entry.name,
								path: `${path}${entry.name}`,
							});
						}
					} else if (entry.kind === 'directory') {
						await scanFiles(entry, `${path}${entry.name}/`);
					}
				}
			};

			await scanFiles(handle);
			setFiles(filesData);
		} catch {
			toast.error(
				'Lỗi khi mở folder. Vui lòng chọn đúng folder được cho phép',
			);
		}
	};

	const handleFileSelect = useCallback(async (file: FileData) => {
		try {
			const fileHandle = file.handle;
			const fileContent = await (await fileHandle.getFile()).text();

			setFileHandle(fileHandle);
			setContent(fileContent);
			setFileName(file.name);
			setLanguage(detectLanguage(file.name));
		} catch {
			toast.error('Lỗi khi đọc file');
		}
	}, []);

	const handleSaveFile = useCallback(async () => {
		if (!fileHandle) return;

		try {
			const writable = await fileHandle.createWritable();
			await writable.write(content);
			await writable.close();
			toast.success('Đã lưu file thành công');
		} catch {
			toast.error('Lỗi khi lưu file');
		}
	}, [fileHandle, content]);

	const handleEditorChange = useCallback((value: string | undefined) => {
		setContent(value ?? '');
	}, []);

	const handleAcceptFix = useCallback(async () => {
		if (fileHandle) {
			try {
				const writable = await fileHandle.createWritable();
				await writable.write(suggestedFix);
				await writable.close();
				setContent(suggestedFix);
				setDiffView(false);
				setSuggestedFix('');
				toast.success('Đã áp dụng và lưu sửa đổi');
				setShowRescanModal(true);
			} catch {
				toast.error('Đã áp dụng sửa đổi nhưng không thể lưu file');
			}
		}
	}, [suggestedFix, fileHandle]);

	const handleRejectFix = useCallback(() => {
		setDiffView(false);
		setSuggestedFix('');
		toast.error('Đã hủy sửa đổi');
	}, []);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === 's') {
				e.preventDefault();
				handleSaveFile();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [fileHandle, handleSaveFile]);

	const handleFixResponse = useCallback(
		(fixedCode: string) => {
			const cleanedCode = fixedCode
				.replace(/^```\w*\n/, '')
				.replace(/\n```$/, '')
				.trim();

			const problematicCode = searchParams.get('problematic_code');

			if (problematicCode && content) {
				const newContent = content.replace(
					problematicCode.trim(),
					cleanedCode.trim(),
				);
				setSuggestedFix(newContent);
				setDiffView(true);
			}
		},
		[content, searchParams],
	);

	const findFileInFolder = async (
		folderHandle: FileSystemDirectoryHandle,
		targetFileName: string,
	): Promise<FileData | null> => {
		const queue = [folderHandle];

		while (queue.length > 0) {
			const currentHandle = queue.shift()!;

			for await (const entry of currentHandle.values()) {
				if (entry.kind === 'file' && entry.name === targetFileName) {
					return {
						handle: entry as FileHandle,
						name: entry.name,
						path: entry.name,
					};
				} else if (entry.kind === 'directory') {
					queue.push(entry);
				}
			}
		}
		return null;
	};

	useEffect(() => {
		const autoOpenFile = async () => {
			const file = decodeURIComponent(searchParams.get('file') ?? '');
			const problematicCode = decodeURIComponent(
				searchParams.get('problematic_code') ?? '',
			);

			if (folderHandle && file && problematicCode) {
				const fileData = await findFileInFolder(
					folderHandle,
					file.split('/').pop() ?? '',
				);
				if (fileData) {
					const fileContent = await (
						await fileData.handle.getFile()
					).text();
					setContent(fileContent);
					setFileHandle(fileData.handle);
					setFileName(fileData.name);
					setLanguage(detectLanguage(fileData.name));
					setIsFileLoaded(true);
				}
			}
		};

		autoOpenFile();
	}, [folderHandle, searchParams]);

	useEffect(() => {
		const fetchFixSuggestion = async () => {
			const vulnerabilityType = searchParams.get('vulnerability_type');
			const file = searchParams.get('file');
			const problematicCode = searchParams.get('problematic_code');
			const vulnerabilityDescription = searchParams.get(
				'vulnerability_description',
			);

			if (
				!apiCalled &&
				isFileLoaded &&
				vulnerabilityType &&
				file &&
				problematicCode &&
				vulnerabilityDescription
			) {
				try {
					setApiCalled(true);
					const response = await axios.post<ApiResponse>('/api/fix', {
						vulnerability_type: vulnerabilityType,
						file: file,
						problematic_code: problematicCode,
						vulnerability_description: vulnerabilityDescription,
					});

					if (
						response.data.status === 'success' &&
						response.data.fixed_code
					) {
						handleFixResponse(response.data.fixed_code);
					} else {
						toast.error(
							response.data.message ?? 'Lỗi không xác định',
						);
					}
				} catch {
					toast.error('Có lỗi xảy ra khi xử lý yêu cầu');
					setApiCalled(false);
				}
			}
		};

		fetchFixSuggestion();
	}, [searchParams, handleFixResponse, apiCalled, isFileLoaded]);

	const handleRescan = () => {
		setShowRescanModal(false);
		navigate('/scan?rescan=true');
	};

	return (
		<div className='flex h-screen flex-col'>
			{showRescanModal && (
				<div className='fixed inset-0 z-50 flex items-center justify-center'>
					<div
						className='absolute inset-0 bg-black/50'
						onClick={() => setShowRescanModal(false)}
					/>

					<div className='relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl'>
						<h3 className='mb-4 text-lg font-medium text-gray-900'>
							Quét lại mã nguồn?
						</h3>

						<p className='mb-6 text-sm text-gray-600'>
							Bạn có muốn quét lại mã nguồn để tìm lỗi bảo mật
							không?
						</p>

						<div className='flex justify-end gap-3'>
							<button
								onClick={handleRescan}
								className='rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600'
							>
								Quét lại
							</button>
							<button
								onClick={() => setShowRescanModal(false)}
								className='rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200'
							>
								Bỏ qua
							</button>
						</div>
					</div>
				</div>
			)}

			{!folderHandle ? (
				<div className='flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-gray-50 to-white px-8 py-12'>
					<div className='text-center'>
						<h1 className='text-4xl font-bold text-gray-900'>
							FPT UniSAST - AI Assistant
						</h1>
						<p className='mt-4 text-lg text-gray-600'>
							Chọn folder "Documents/uniast/uploads/fpt_scan"
						</p>
					</div>

					<div className='mt-12 w-full max-w-2xl'>
						<div
							onClick={handleOpenFolder}
							className='group relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-white/50 p-12 text-center backdrop-blur-sm transition-all duration-300 hover:border-gray-400 hover:bg-white/80 hover:shadow-lg'
						>
							<div className='space-y-4'>
								<FontAwesomeIcon
									icon={faFolderOpen}
									className='h-12 w-12 text-gray-400 transition-transform duration-300 group-hover:scale-110 group-hover:text-gray-500'
								/>
								<div className='space-y-2'>
									<p className='text-lg font-medium text-gray-700'>
										Click để mở folder
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			) : (
				<div className='flex flex-1 overflow-hidden bg-gradient-to-br from-gray-50 via-gray-50 to-white'>
					<div className='z-20 w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white/80 p-4 backdrop-blur-sm'>
						<div className='mb-4'>
							<div className='font-medium text-gray-900'>
								Files:
							</div>
						</div>
						{files.map((file) => (
							<div
								key={file.path}
								onClick={() => handleFileSelect(file)}
								className={`mb-2 cursor-pointer rounded-lg p-2 transition-all duration-200 hover:bg-gray-100 hover:shadow-sm ${
									fileName === file.name
										? 'bg-gray-100 shadow-sm'
										: ''
								}`}
							>
								{file.name}
							</div>
						))}
					</div>

					<div className='relative flex-1 overflow-hidden'>
						<div className='flex items-center justify-between bg-white/80 p-4 shadow-sm backdrop-blur-sm'>
							<span className='font-medium text-gray-700'>
								{diffView && suggestedFix
									? 'Đề xuất sửa lỗi'
									: 'Editor'}
							</span>
							<div className='flex gap-2'>
								<button
									onClick={() => setShowRescanModal(true)}
									className='rounded-lg bg-blue-500 px-4 py-2 text-white transition-all duration-200 hover:bg-blue-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
								>
									Quét lại
								</button>
								{diffView && suggestedFix && (
									<>
										<button
											onClick={handleAcceptFix}
											className='rounded-lg bg-green-500 px-4 py-2 text-white transition-all duration-200 hover:bg-green-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
										>
											Chấp nhận
										</button>
										<button
											onClick={handleRejectFix}
											className='rounded-lg bg-red-500 px-4 py-2 text-white transition-all duration-200 hover:bg-red-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
										>
											Từ chối
										</button>
									</>
								)}
							</div>
						</div>
						{diffView && suggestedFix ? (
							<DiffEditor
								height='calc(100% - 64px)'
								language={language}
								original={content}
								modified={suggestedFix}
								theme='github-light'
								options={{
									readOnly: true,
									renderSideBySide: true,
									minimap: { enabled: false },
									scrollBeyondLastLine: false,
									padding: { top: 16 },
								}}
							/>
						) : (
							<Editor
								height='100%'
								defaultLanguage={language}
								language={language}
								value={content}
								onChange={handleEditorChange}
								options={{
									minimap: { enabled: false },
									fontSize: 14,
									inlayHints: { enabled: 'on' },
									wordWrap: 'on',
									automaticLayout: true,
									scrollBeyondLastLine: false,
									readOnly:
										fileName.endsWith('.exe') ||
										fileName.endsWith('.dll') ||
										fileName.endsWith('.bin'),
									padding: { top: 16 },
								}}
								theme='github-light'
								className='rounded-lg shadow-sm'
							/>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default FPTEditor;
