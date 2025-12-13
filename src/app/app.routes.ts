import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: "",
        redirectTo: "/nba",
        pathMatch: "full"
    },
    {
      path: 'ncaa',
      loadComponent: () => import('./pages/ncaa/ncaa.component').then(m => m.NCAAComponent),
      pathMatch: 'full'
    },
    {
      path: 'nba',
      loadComponent: () => import('./pages/nba/nba.component').then(m => m.NbaComponent),
      pathMatch: 'full'
    },
    {
      path: 'custom-games',
      loadComponent: () => import('./pages/custom-games/custom-games.component').then(m => m.CustomGamesComponent),
      pathMatch: 'full'
    },
    {
      path: 'custom-games-ncaa',
      loadComponent: () => import('./pages/custom-games-ncaa/custom-games-ncaa.component').then(m => m.CustomGamesNcaaComponent),
      pathMatch: 'full'
    },
    {
      path: 'stats',
      loadComponent: () => import('./pages/stats/stats.component').then(m => m.StatsComponent),
      pathMatch: 'full'
    },
];
