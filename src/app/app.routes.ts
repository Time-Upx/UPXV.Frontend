// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ConsumableListComponent } from './components/consumable-list/consumable-list.component';
import { ConsumableDetailComponent } from './components/consumable-detail/consumable-detail.component';
import { PatrimonyListComponent } from './components/patrimony-list/patrimony-list.component';
import { PatrimonyDetailComponent } from './components/patrimony-detail/patrimony-detail.component';
import { TagListComponent } from './components/tag-list/tag-list.component';
import { StatusListComponent } from './components/status-list/status-list.component';
import { UnitListComponent } from './components/unit-list/unit-list.component';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },
    { path: 'consumable', component: ConsumableListComponent },
    { path: 'consumable/:nid', component: ConsumableDetailComponent },
    { path: 'patrimony', component: PatrimonyListComponent },
    { path: 'patrimony/:nid', component: PatrimonyDetailComponent },
    { path: 'tags', component: TagListComponent },
    { path: 'statuses', component: StatusListComponent },
    { path: 'units', component: UnitListComponent }
];