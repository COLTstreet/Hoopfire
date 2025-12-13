import { Routes } from '@angular/router';
import { NCAAComponent } from './pages/ncaa/ncaa.component';
import { NbaComponent } from './pages/nba/nba.component';
import { CustomGamesComponent } from './pages/custom-games/custom-games.component';
import { CustomGamesNcaaComponent } from './pages/custom-games-ncaa/custom-games-ncaa.component';
import { StatsComponent } from './pages/stats/stats.component';

export const routes: Routes = [
    {
        path: "",
        redirectTo: "/nba",
        pathMatch: "full"
    },
    {
      path: 'ncaa',
      component: NCAAComponent,
      pathMatch: 'full'
    },
    {
      path: 'nba',
      component: NbaComponent,
      pathMatch: 'full'
    },
    {
      path: 'custom-games',
      component: CustomGamesComponent,
      pathMatch: 'full'
    },
    {
      path: 'custom-games-ncaa',
      component: CustomGamesNcaaComponent,
      pathMatch: 'full'
    },
    {
      path: 'stats',
      component: StatsComponent,
      pathMatch: 'full'
    },
];
