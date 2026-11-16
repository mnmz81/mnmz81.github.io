import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { provideMuiIcons } from '@mushilu-san/ui/primitives';
import { routes } from './app.routes';
import { CONTENT_LOADER, browserContentLoader } from './core/content-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    provideHttpClient(withFetch()),
    // The library has `github` and `mail` but no LinkedIn icon (stroke paths, 24px grid).
    provideMuiIcons({
      linkedin: {
        paths: [
          'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z',
          'M2 9h4v12H2z',
          'M2 4a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
        ],
      },
    }),
    provideClientHydration(withEventReplay()),
    { provide: CONTENT_LOADER, useFactory: browserContentLoader },
  ],
};
