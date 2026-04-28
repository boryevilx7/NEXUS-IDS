'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { useNavigate } from 'react-router-dom';
import {
	AtSignIcon,
	ChevronLeftIcon,
	Grid2x2PlusIcon,
} from 'lucide-react';
import { Input } from './input';

export function AuthPage() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();

	// Demo credentials
	const DEMO_EMAIL = 'demo@nexus.com';
	const DEMO_PASSWORD = 'Test@123';

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		// Check credentials
		if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
			// Store auth state in localStorage
			localStorage.setItem('user_authenticated', 'true');
			localStorage.setItem('user_email', email);

			setLoading(false);
			setTimeout(() => {
				navigate('/dashboard');
			}, 500);
		} else {
			setError('Invalid credentials. Use demo@nexus.com / Test@123');
			setLoading(false);
		}
	};

	return (
		<main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
			<div className="bg-muted/60 relative hidden h-full flex-col border-r p-10 lg:flex">
				<div className="from-background absolute inset-0 z-10 bg-gradient-to-t to-transparent" />
				<div className="z-10 flex items-center gap-2">
					<Grid2x2PlusIcon className="size-6" />
					<p className="text-xl font-semibold">Nexus</p>
				</div>
				<div className="absolute inset-0">
					<FloatingPaths position={1} />
					<FloatingPaths position={-1} />
				</div>
			</div>
			<div className="relative flex min-h-screen flex-col justify-center p-4">
				<div
					aria-hidden
					className="absolute inset-0 isolate contain-strict -z-10 opacity-60"
				>
					<div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)] absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full" />
					<div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 [translate:5%_-50%] rounded-full" />
					<div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full" />
				</div>
				<Button variant="ghost" className="absolute top-7 left-5" asChild>
					<a href="/">
						<ChevronLeftIcon className='size-4 me-2' />
						Home
					</a>
				</Button>
				<div className="mx-auto space-y-4 sm:w-sm">
					<div className="flex items-center gap-2 lg:hidden">
						<Grid2x2PlusIcon className="size-6" />
						<p className="text-xl font-semibold">Nexus</p>
					</div>
					<div className="flex flex-col space-y-1">
						<h1 className="font-heading text-2xl font-bold tracking-wide">
							Sign In
						</h1>
						<p className="text-muted-foreground text-base">
							Sign in to access Nexus IDS Platform.
						</p>
					</div>

					<form className="space-y-4" onSubmit={handleSubmit}>
						<div className="relative h-max">
							<Input
								placeholder="Email address"
								className="peer ps-9"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								disabled={loading}
								required
							/>
							<div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
								<AtSignIcon className="size-4" aria-hidden="true" />
							</div>
						</div>

						<Input
							placeholder="Password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							disabled={loading}
							required
						/>

						{error && (
							<p className="text-sm text-red-500 font-medium">{error}</p>
						)}

						<div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
							<p className="text-xs text-blue-400 font-medium">Demo Credentials:</p>
							<p className="text-xs text-blue-300 mt-1">Email: demo@nexus.com</p>
							<p className="text-xs text-blue-300">Password: Test@123</p>
						</div>

						<Button type="submit" className="w-full" size="lg" disabled={loading}>
							<span>{loading ? 'Signing in...' : 'Sign In'}</span>
						</Button>
					</form>

					<p className="text-muted-foreground mt-8 text-sm">
						By clicking sign in, you agree to our{' '}
						<a
							href="#"
							className="hover:text-primary underline underline-offset-4"
						>
							Terms of Service
						</a>{' '}
						and{' '}
						<a
							href="#"
							className="hover:text-primary underline underline-offset-4"
						>
							Privacy Policy
						</a>
						.
					</p>
				</div>
			</div>
		</main>
	);
}

function FloatingPaths({ position }: { position: number }) {
	const paths = Array.from({ length: 36 }, (_, i) => ({
		id: i,
		d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
			380 - i * 5 * position
		} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
			152 - i * 5 * position
		} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
			684 - i * 5 * position
		} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
		color: `rgba(15,23,42,${0.1 + i * 0.03})`,
		width: 0.5 + i * 0.03,
	}));

	return (
		<div className="pointer-events-none absolute inset-0">
			<svg
				className="h-full w-full text-slate-950 dark:text-white"
				viewBox="0 0 696 316"
				fill="none"
			>
				<title>Background Paths</title>
				{paths.map((path) => (
					<motion.path
						key={path.id}
						d={path.d}
						stroke="currentColor"
						strokeWidth={path.width}
						strokeOpacity={0.1 + path.id * 0.03}
						initial={{ pathLength: 0.3, opacity: 0.6 }}
						animate={{
							pathLength: 1,
							opacity: [0.3, 0.6, 0.3],
							pathOffset: [0, 1, 0],
						}}
						transition={{
							duration: 20 + Math.random() * 10,
							repeat: Number.POSITIVE_INFINITY,
							ease: 'linear',
						}}
					/>
				))}
			</svg>
		</div>
	);
}
