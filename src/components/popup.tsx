import {
	faCheck,
	faCode,
	faCopy,
	faFileCode,
	faSpinner,
	faWandMagicSparkles,
	faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import Prism from 'prismjs';
import 'prismjs/components/prism-java';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

interface PopupProps {
	vulnerabilityType: string;
	file: string;
	problematicCode: string;
	vulnerabilityDescription: string;
}

const Popup: React.FC<PopupProps> = ({
	vulnerabilityType,
	file,
	problematicCode,
	vulnerabilityDescription,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [response, setResponse] = useState<{
		status: string;
		fixed_code: string;
	} | null>(null);
	const [showResult, setShowResult] = useState(false);
	const [copied, setCopied] = useState(false);
	const [showOptions, setShowOptions] = useState(false);
	const optionsRef = useRef<HTMLDivElement>(null);
	const modalRef = useRef<HTMLDivElement>(null);

	const handleQuickFix = async () => {
		setShowOptions(false);
		setIsLoading(true);
		setShowResult(true);

		try {
			const response = await axios.post('/api/fix', {
				vulnerability_type: vulnerabilityType,
				file: file,
				problematic_code: problematicCode,
				vulnerability_description: vulnerabilityDescription,
			});
			setResponse(response.data);
		} catch {
			toast.error('Không thể tự động sửa', {
				duration: 3000,
				position: 'top-right',
				className: 'bg-white text-red-600 border border-red-100',
			});
			setShowResult(false);
		} finally {
			setIsLoading(false);
		}
	};

	const handleUploadToFix = () => {
		setShowOptions(false);
		const params = new URLSearchParams({
			vulnerability_type: vulnerabilityType,
			file,
			problematic_code: problematicCode,
			vulnerability_description: vulnerabilityDescription,
		});
		window.open(`/fpt-editor?${params.toString()}`, '_blank');
	};

	const handleStreamEditor = () => {
		setShowOptions(false);
		const params = new URLSearchParams({
			vulnerability_type: vulnerabilityType,
			file,
			vulnerability_description: vulnerabilityDescription,
		});
		window.open(`/stream-editor?${params.toString()}`, '_blank');
	};

	const handleCopy = async () => {
		if (response) {
			const { code } = processCodeBlock(response.fixed_code);
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const processCodeBlock = (code: string) => {
		const languageRegex = /^```([\w-]*)\n/;
		const match = languageRegex.exec(code);
		const language = match ? match[1] : 'plaintext';
		const processedCode = code
			.replace(/^```[\w-]*\n/, '')
			.replace(/\n```$/, '')
			.trim();
		return { code: processedCode, language };
	};

	useEffect(() => {
		if (response) {
			Prism.highlightAll();
		}
	}, [response]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				optionsRef.current &&
				!optionsRef.current.contains(event.target as Node)
			) {
				setShowOptions(false);
			}

			if (
				modalRef.current &&
				!modalRef.current.contains(event.target as Node)
			) {
				setShowResult(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	return (
		<div className='relative'>
			<button
				onClick={() => setShowOptions(true)}
				className='absolute -top-10 right-0 flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:border-gray-600 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
			>
				<FontAwesomeIcon
					icon={isLoading ? faSpinner : faWandMagicSparkles}
					className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
				/>
				Tự động sửa
			</button>

			{showOptions && (
				<div
					ref={optionsRef}
					className='absolute right-0 top-2 z-50 w-48 rounded-md border border-gray-200 bg-white shadow-2xl'
				>
					<div className='py-1' role='menu'>
						<button
							onClick={handleQuickFix}
							className='flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
							role='menuitem'
						>
							<FontAwesomeIcon
								icon={faWandMagicSparkles}
								className='mr-3 h-4 w-4 text-gray-400'
							/>
							Sửa nhanh
						</button>
						<button
							onClick={handleUploadToFix}
							className='flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
							role='menuitem'
						>
							<FontAwesomeIcon
								icon={faCode}
								className='mr-3 h-4 w-4 text-gray-400'
							/>
							Tự động sửa
						</button>
						<button
							onClick={handleStreamEditor}
							className='flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
							role='menuitem'
						>
							<FontAwesomeIcon
								icon={faFileCode}
								className='mr-3 h-4 w-4 text-gray-400'
							/>
							Sửa toàn bộ file
						</button>
					</div>
				</div>
			)}

			{showResult && response && (
				<div className='fixed inset-0 z-50 flex items-center justify-center'>
					<div
						ref={modalRef}
						className='w-full max-w-4xl transform overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-2xl'
					>
						<div className='absolute right-4 top-4'>
							<button
								onClick={() => setShowResult(false)}
								className='rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none'
							>
								<FontAwesomeIcon
									icon={faXmark}
									className='h-6 w-6'
								/>
							</button>
						</div>

						<div>
							<h3 className='text-lg font-medium leading-6 text-gray-900'>
								Kết quả sửa bởi AI
							</h3>

							<div className='mt-4'>
								<div className='relative overflow-hidden rounded-lg border-2 border-gray-300 bg-white'>
									<div className='absolute right-2 top-2'>
										<button
											onClick={handleCopy}
											className='rounded-md bg-white p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
										>
											<FontAwesomeIcon
												icon={copied ? faCheck : faCopy}
												className='h-4 w-4'
											/>
										</button>
									</div>
									<pre className='overflow-x-auto p-4 text-sm'>
										{(() => {
											const { code, language } =
												processCodeBlock(
													response.fixed_code,
												);
											return (
												<code
													className={`language-${language} block`}
													dangerouslySetInnerHTML={{
														__html: code,
													}}
												/>
											);
										})()}
									</pre>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Popup;
