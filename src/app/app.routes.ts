import { Routes } from '@angular/router';
import { NCAAComponent } from './pages/ncaa/ncaa.component';
import { NbaComponent } from './pages/nba/nba.component';

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
];
