const form = document.getElementById('genForm')
const statusEl = document.getElementById('status')
const previewImg = document.getElementById('previewImg')
const downloadLink = document.getElementById('downloadLink')
const downloadBtn = document.getElementById('downloadBtn')

// Authentication & Gallery State
let currentUser = null
const MAX_SAVED_IMAGES = 8

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
	restoreUserSession()
	setupAuthListeners()
})

// ============= AUTH FUNCTIONS =============

function setupAuthListeners() {
	const loginForm = document.getElementById('loginForm')
	const signupForm = document.getElementById('signupForm')

	if (loginForm) {
		loginForm.addEventListener('submit', async (e) => {
			e.preventDefault()
			const email = document.getElementById('loginEmail').value
			const password = document.getElementById('loginPassword').value
			await handleLogin(email, password)
		})
	}

	if (signupForm) {
		signupForm.addEventListener('submit', async (e) => {
			e.preventDefault()
			const email = document.getElementById('signupEmail').value
			const password = document.getElementById('signupPassword').value
			const confirm = document.getElementById('signupPasswordConfirm').value

			if (password !== confirm) {
				showSignupError('Passwords do not match')
				return
			}

			if (password.length < 6) {
				showSignupError('Password must be at least 6 characters')
				return
			}

			await handleSignup(email, password)
		})
	}
}

async function handleLogin(email, password) {
	const errorEl = document.getElementById('loginError')
	errorEl.textContent = ''

	try {
		const res = await fetch('http://localhost:3000/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password })
		})

		const data = await res.json()

		if (!res.ok) {
			showLoginError(data.error || 'Login failed')
			return
		}

		// Save user session
		currentUser = { email, userId: data.userId }
		localStorage.setItem('unilogos_user', JSON.stringify(currentUser))
		localStorage.setItem('unilogos_token', data.token)

		closeLoginModal()
		updateNavbar()
		document.getElementById('loginForm').reset()
	} catch (err) {
		console.error('Login error:', err)
		showLoginError('Network error. Please try again.')
	}
}

async function handleSignup(email, password) {
	const errorEl = document.getElementById('signupError')
	errorEl.textContent = ''

	try {
		const res = await fetch('http://localhost:3000/auth/signup', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password })
		})

		const data = await res.json()

		if (!res.ok) {
			showSignupError(data.error || 'Signup failed')
			return
		}

		// Auto login after signup
		currentUser = { email, userId: data.userId }
		localStorage.setItem('unilogos_user', JSON.stringify(currentUser))
		localStorage.setItem('unilogos_token', data.token)

		closeSignupModal()
		updateNavbar()
		document.getElementById('signupForm').reset()
	} catch (err) {
		console.error('Signup error:', err)
		showSignupError('Network error. Please try again.')
	}
}

function logout(event) {
	event.preventDefault()
	currentUser = null
	localStorage.removeItem('unilogos_user')
	localStorage.removeItem('unilogos_token')
	updateNavbar()
	closeUserMenu()
}

function restoreUserSession() {
	const userStr = localStorage.getItem('unilogos_user')
	if (userStr) {
		try {
			currentUser = JSON.parse(userStr)
			updateNavbar()
		} catch (e) {
			console.error('Failed to restore session:', e)
		}
	}
}

function updateNavbar() {
	const navLogin = document.getElementById('navLogin')
	const navSignup = document.getElementById('navSignup')
	const navUser = document.getElementById('navUser')
	const userEmail = document.getElementById('userEmail')

	if (currentUser) {
		navLogin.style.display = 'none'
		navSignup.style.display = 'none'
		navUser.style.display = 'block'
		userEmail.textContent = currentUser.email.split('@')[0]
	} else {
		navLogin.style.display = 'block'
		navSignup.style.display = 'block'
		navUser.style.display = 'none'
	}
}

// ============= MODAL FUNCTIONS =============

function openLoginModal(event) {
	event.preventDefault()
	document.getElementById('loginModal').style.display = 'flex'
}

function closeLoginModal() {
	document.getElementById('loginModal').style.display = 'none'
}

function openSignupModal(event) {
	event.preventDefault()
	document.getElementById('signupModal').style.display = 'flex'
}

function closeSignupModal() {
	document.getElementById('signupModal').style.display = 'none'
}

function switchToSignup(event) {
	event.preventDefault()
	closeLoginModal()
	openSignupModal({ preventDefault: () => {} })
}

function switchToLogin(event) {
	event.preventDefault()
	closeSignupModal()
	openLoginModal({ preventDefault: () => {} })
}

function showLoginError(msg) {
	document.getElementById('loginError').textContent = msg
}

function showSignupError(msg) {
	document.getElementById('signupError').textContent = msg
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
	const loginModal = document.getElementById('loginModal')
	const signupModal = document.getElementById('signupModal')
	const galleryModal = document.getElementById('galleryModal')

	if (e.target === loginModal) closeLoginModal()
	if (e.target === signupModal) closeSignupModal()
	if (e.target === galleryModal) closeGallery()
})

// ============= GALLERY FUNCTIONS =============

function getSavedImages() {
	if (!currentUser) return []
	const key = `unilogos_images_${currentUser.userId}`
	const saved = localStorage.getItem(key)
	return saved ? JSON.parse(saved) : []
}

function saveImage(imageUrl) {
	if (!currentUser) {
		alert('Please login to save images')
		return
	}

	const key = `unilogos_images_${currentUser.userId}`
	let images = getSavedImages()

	// Add new image at the beginning
	images.unshift({
		url: imageUrl,
		timestamp: Date.now()
	})

	// Keep only last 8 images
	images = images.slice(0, MAX_SAVED_IMAGES)

	localStorage.setItem(key, JSON.stringify(images))
}

function deleteImage(index) {
	if (!currentUser) return

	const key = `unilogos_images_${currentUser.userId}`
	let images = getSavedImages()
	images.splice(index, 1)
	localStorage.setItem(key, JSON.stringify(images))
	renderGallery()
}

function openGallery(event) {
	event.preventDefault()
	if (!currentUser) return
	document.getElementById('galleryModal').style.display = 'flex'
	renderGallery()
}

function closeGallery() {
	document.getElementById('galleryModal').style.display = 'none'
}

function toggleUserMenu(event) {
	event.preventDefault()
	const menu = document.getElementById('userMenu')
	menu.style.display = menu.style.display === 'none' ? 'block' : 'none'
}

function closeUserMenu() {
	document.getElementById('userMenu').style.display = 'none'
}

function renderGallery() {
	const gallery = document.getElementById('galleryGrid')
	const images = getSavedImages()

	gallery.innerHTML = ''

	if (images.length === 0) {
		gallery.innerHTML = '<p style="grid-column: 1/-1; text-align: center; opacity: 0.7;">No saved images yet</p>'
		return
	}

	images.forEach((img, idx) => {
		const item = document.createElement('div')
		item.className = 'galleryItem'

		const imgEl = document.createElement('img')
		imgEl.src = img.url
		imgEl.alt = 'Saved image'
		imgEl.onclick = () => {
			previewImg.src = img.url
			downloadLink.href = img.url
			closeGallery()
		}

		const deleteBtn = document.createElement('button')
		deleteBtn.className = 'deleteBtn'
		deleteBtn.innerHTML = '×'
		deleteBtn.onclick = (e) => {
			e.stopPropagation()
			deleteImage(idx)
		}

		item.appendChild(imgEl)
		item.appendChild(deleteBtn)
		gallery.appendChild(item)
	})
}

// Close user menu when clicking elsewhere
document.addEventListener('click', (e) => {
	const navUser = document.getElementById('navUser')
	if (!navUser.contains(e.target)) {
		closeUserMenu()
	}
})

// ============= IMAGE GENERATION =============

async function submitGeneration(payload) {
	const res = await fetch('http://localhost:3000/generateposter', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	})

	const data = await res.json()
	if (!res.ok) throw new Error(data?.error || 'generation_failed')
	return data
}

form?.addEventListener('submit', async (e) => {
	e.preventDefault()
	statusEl.textContent = 'Generating...'
	previewImg.removeAttribute('src')
	downloadLink.setAttribute('href', '#')

	const fd = new FormData(form)
	const payload = {
		generationType: fd.get('generationType') || 'poster',
		eventName: fd.get('eventName') || '',
		theme: fd.get('theme') || '',
		location: fd.get('location') || '',
		date: fd.get('date') || '',
		eventType: fd.get('eventType') || '',
		extraPrompt: fd.get('extraPrompt') || '',
		aspect_ratio: fd.get('aspect_ratio') || '3:2'
	}

	try {
		const { href } = await submitGeneration(payload)
		if (href) {
			previewImg.src = href
			downloadLink.href = href
			statusEl.textContent = 'Done'

			// Auto-save if user is logged in
			if (currentUser) {
				saveImage(href)
				statusEl.textContent = 'Done - Saved'
			}
		} else {
			statusEl.textContent = 'No image returned'
		}
	} catch (err) {
		console.error(err)
		statusEl.textContent = `Error: ${err.message || err}`
	}
})

// Reset button functionality
const resetBtn = document.getElementById('resetBtn')
if (resetBtn) {
	resetBtn.addEventListener('click', () => {
		form.reset()
		previewImg.removeAttribute('src')
		downloadLink.setAttribute('href', '#')
		statusEl.textContent = ''
	})
}

// Expose function if needed elsewhere
window.generatePoster = async function generatePoster() {
	form?.dispatchEvent(new Event('submit'))
}

// Download current image as a file
downloadBtn?.addEventListener('click', async () => {
	const src = previewImg?.getAttribute('src')
	if (!src) {
		statusEl.textContent = 'No image to download'
		return
	}
	try {
		statusEl.textContent = 'Preparing download...'
		const resp = await fetch(src, { mode: 'cors' })
		const blob = await resp.blob()
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `poster_${Date.now()}.png`
		document.body.appendChild(a)
		a.click()
		URL.revokeObjectURL(url)
		a.remove()
		statusEl.textContent = 'Downloaded'
	} catch (e) {
		console.error(e)
		statusEl.textContent = 'Download failed'
	}
})
