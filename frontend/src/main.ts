import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((error: unknown) => {
	const message = document.createElement('p');
	message.setAttribute('role', 'alert');
	message.textContent = 'Nem sikerült elindítani az alkalmazást.';
	document.body.appendChild(message);
	throw error;
});
