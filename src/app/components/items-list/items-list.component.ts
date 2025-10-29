import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UtilsService, PageDTO } from '../../services/utils.service';

interface Item {
  type: 'patrimony' | 'consumable';
  id: number;
  name: string;
  tags?: string[];
  status?: string;
  quantity?: number;
  unit?: string;
}

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './items-list.component.html',
  styleUrls: ['./items-list.component.css']
})
export class ItemListComponent implements OnInit {
  items: Item[] = [];
  filteredItems: Item[] = [];
  searchTerm = '';
  loading = false;
  error = '';

  // Paginação
  currentPage = 0;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  pageNumbers: number[] = []; // Array de páginas para exibir

  constructor(private utilsService: UtilsService) { }

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    this.loading = true;
    this.error = '';

    this.utilsService.listarItems(this.currentPage, this.pageSize).subscribe({
      next: (page: PageDTO<any>) => {
        this.totalCount = page.totalCount;
        this.totalPages = page.totalPages;
        this.updatePageNumbers();

        this.items = page.items.map((dto: any) => {
          if (dto.patrimony) {
            return {
              type: 'patrimony' as const,
              id: dto.patrimony.id,
              name: dto.patrimony.name,
              tags: dto.patrimony.tags?.map((t: any) => t.name) || [],
              status: dto.patrimony.status.name
            };
          } else if (dto.consumable) {
            return {
              type: 'consumable' as const,
              id: dto.consumable.id,
              name: dto.consumable.name,
              tags: dto.consumable.tags?.map((t: any) => t.name) || [],
              quantity: dto.consumable.quantity,
              unit: dto.consumable.unit.abbreviation
            };
          }
          return null;
        }).filter(Boolean) as Item[];

        this.filteredItems = [...this.items];
        this.loading = false;
      },
      error: () => {
        this.error = 'Erro ao carregar itens. Tente novamente.';
        this.loading = false;
      }
    });
  }

  // Gera o array de páginas para exibir (com ... se necessário)
  updatePageNumbers() {
    const maxVisible = 5;
    const pages: number[] = [];

    if (this.totalPages <= maxVisible) {
      for (let i = 0; i < this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(0, this.currentPage - 2);
      const end = Math.min(this.totalPages, start + maxVisible);

      if (start > 0) pages.push(0);
      if (start > 1) pages.push(-1); // indicador de ...

      for (let i = start; i < end; i++) {
        pages.push(i);
      }

      if (end < this.totalPages - 1) pages.push(-1);
      if (end < this.totalPages) pages.push(this.totalPages - 1);
    }

    this.pageNumbers = pages;
  }

  // Filtro local
  onSearch() {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredItems = this.items.filter(item =>
      item.name.toLowerCase().includes(term)
    );
  }

  // Navegação
  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadItems();
    }
  }

  // Rota correta com base no tipo
  getRoute(item: Item): string[] {
    return item.type === 'patrimony'
      ? ['/patrimony', item.id.toString()]
      : ['/consumable', item.id.toString()];
  }
}