import { Editor } from '@monaco-editor/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

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

const StreamEditor: React.FC = () => {
	const [searchParams] = useSearchParams();
	const [content, setContent] = useState<string>('');
	const [language, setLanguage] = useState<string>('plaintext');
	const [isStreaming, setIsStreaming] = useState(false);
	const [currentFileHandle, setCurrentFileHandle] =
		useState<FileSystemFileHandle | null>(null);
	const [streamContent, setStreamContent] = useState<string>('');
	const [isTyping, setIsTyping] = useState(false);
	const [socket, setSocket] = useState<Socket | null>(null);

	useEffect(() => {
		const newSocket = io('http://localhost:5000', {
			transports: ['websocket'],
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000
		});
		setSocket(newSocket);

		newSocket.on('fix_chunk', (data) => {
			if (data.status === 'streaming') {
				const cleanedChunk = data.chunk
					.replace(/```[\w-]*\n?/g, '')  // Remove ``` and any language identifier
					.replace(/```\n?/g, '');       // Remove closing ```

				setStreamContent(prev => prev + cleanedChunk);
			}
		});

		newSocket.on('fix_complete', (data) => {
			if (data.status === 'success') {
				setIsTyping(false);
				toast.success('Fix generation completed');
			}
		});

		newSocket.on('fix_error', (data) => {
			setIsTyping(false);
			toast.error(data.message);
		});

		newSocket.on('connect_error', (error) => {
			toast.error('Connection error: Unable to connect to server');
			console.error('Socket connection error:', error);
		});

		return () => {
			newSocket.disconnect();
		};
	}, []);

	const detectLanguage = useCallback((fileName: string): string => {
		const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
		return (
			languageMap[extension as keyof typeof languageMap] || 'plaintext'
		);
	}, []);

	const handleEditorChange = useCallback((value: string | undefined) => {
		setContent(value ?? '');
	}, []);

	const startStreamingWithContent = useCallback(
		(problematicCode: string) => {
			const file = searchParams.get('file');
			const vulnerabilityType = searchParams.get('vulnerability_type');
			const vulnerabilityDescription = decodeURIComponent(
				searchParams.get('vulnerability_description') ?? '',
			);

			if (!file || !vulnerabilityType || !vulnerabilityDescription) {
				toast.error('Thiếu thông tin cần thiết trong URL');
				return;
			}

			if (!socket) {
				toast.error('Socket connection not established');
				return;
			}

			setIsStreaming(true);
			setIsTyping(true);
			setStreamContent('');

			socket.emit('start_fix', {
				vulnerability_type: vulnerabilityType,
				file: file,
				problematic_code: problematicCode,
				vulnerability_description: vulnerabilityDescription,
			});
		},
		[searchParams, socket],
	);

	const handleOpenFile = useCallback(async () => {
		const file = searchParams.get('file');
		if (!file) {
			toast.error('Thiếu thông tin file trong URL');
			return;
		}

		try {
			const [fileHandle] = await window.showOpenFilePicker({
				types: [
					{
						description: 'Code Files',
						accept: {
							'text/*': [
								'.java',
								'.ts',
								'.js',
								'.py',
								'.cpp',
								'.cs',
							],
						},
					},
				],
			});

			const fileContent = await (await fileHandle.getFile()).text();
			setContent(fileContent);
			setLanguage(detectLanguage(file));
			setCurrentFileHandle(fileHandle);
			await startStreamingWithContent(fileContent);
			return fileContent;
		} catch (error) {
			if (
				!(error instanceof DOMException && error.name === 'AbortError')
			) {
				toast.error('Không thể đọc file. Vui lòng chọn đúng file.');
			}
			console.error(error);
			return null;
		}
	}, [searchParams, detectLanguage, startStreamingWithContent]);

	const handleSaveFile = useCallback(async () => {
		try {
			if (!currentFileHandle) {
				const handle = await window.showSaveFilePicker({
					types: [{
						description: 'Code Files',
						accept: {
							'text/*': ['.java', '.ts', '.js', '.py', '.cpp', '.cs'],
						},
					}],
				});
				setCurrentFileHandle(handle);
				const writable = await handle.createWritable();
				await writable.write(streamContent || content);
				await writable.close();
			} else {
				const writable = await currentFileHandle.createWritable();
				await writable.write(streamContent || content);
				await writable.close();
			}
			toast.success('Đã lưu file thành công');
		} catch (error) {
			if (!(error instanceof DOMException && error.name === 'AbortError')) {
				toast.error('Không thể lưu file');
				console.error(error);
			}
		}
	}, [currentFileHandle, content, streamContent]);
const navigate = useNavigate();
const handleRescan = () => {
	navigate('/scan?rescan=true');
}
	return (
		<div className='flex h-screen flex-col overflow-hidden bg-gradient-to-br from-gray-50 via-gray-50 to-white'>
			<div className='flex h-12 items-center justify-between bg-white px-4 shadow-sm'>
				<div className='text-sm text-gray-600'>
					{isTyping ? 'Đang nhận phản hồi...' : 'Sẵn sàng'}
				</div>
				<div className='flex gap-2'>
					<button onClick={handleRescan} className='rounded-lg bg-green-500 px-4 py-2 text-white transition-all duration-200 hover:bg-gray-600 disabled:opacity-50'>
						Rescan
					</button>
					<button
						onClick={handleOpenFile}
						disabled={isStreaming}
						className='rounded-lg bg-gray-500 px-4 py-2 text-white transition-all duration-200 hover:bg-gray-600 disabled:opacity-50'
					>
						Mở file
					</button>
					<button
						onClick={handleSaveFile}
						disabled={isStreaming && !streamContent}
						className='rounded-lg bg-blue-500 px-4 py-2 text-white transition-all duration-200 hover:bg-blue-600 disabled:opacity-50'
					>
						Lưu file
					</button>
				</div>
			</div>
			<div className='flex-1 p-4'>
				<Editor
					height='calc(100vh - 80px)'
					defaultLanguage={language}
					language={language}
					value={streamContent || content}
					onChange={handleEditorChange}
					options={{
						minimap: { enabled: false },
						fontSize: 14,
						inlayHints: { enabled: 'on' },
						wordWrap: 'on',
						automaticLayout: true,
						scrollBeyondLastLine: false,
						padding: { top: 16 },
						readOnly: isTyping,
					}}
					theme='github-light'
					className='rounded-lg shadow-sm'
				/>
			</div>
		</div>
	);
};

export default StreamEditor;
