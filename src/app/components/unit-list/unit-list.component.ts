import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UtilsService, PageDTO } from '../../services/utils.service';
import { ModalService, ModalActionItem } from '../../services/modal.service'; // Import correto
import { Subscription } from 'rxjs';

interface Unit {
  id: number;
  name: string;
  abbreviation: string;
  description?: string;
  hover?: boolean;
}

@Component({
  selector: 'app-unit-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './unit-list.component.html',
  styleUrls: ['./unit-list.component.css']
})
export class UnitListComponent implements OnInit, OnDestroy {
  units: Unit[] = [];
  filteredUnits: Unit[] = [];
  searchTerm = '';
  mensagemErro = '';
  mensagemSucesso = '';
  formGroup: FormGroup;
  editModeId: number | null = null;
  carregandoForm = false;
  formSubmitted = false;
  loading = false;

  // Paginação
  currentPage = 0;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  pageNumbers: number[] = [];

  private subscription = new Subscription();

  constructor(
    private utilsService: UtilsService,
    private modalService: ModalService,
    private fb: FormBuilder
  ) {
    this.formGroup = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      abbreviation: ['', [Validators.required, Validators.maxLength(10)]],
      description: ['']
    });
  }

  ngOnInit() {
    this.loadUnits();

    // Escuta confirmação de exclusão
    this.subscription.add(
      this.modalService.onConfirm().subscribe((item: ModalActionItem) => {
        if (item.type === 'unit') {
          this.deletar(item.nid); // nid = id
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadUnits() {
    this.loading = true;
    this.mensagemErro = '';

    this.utilsService.listarUnits(this.currentPage, this.pageSize).subscribe({
      next: (page: PageDTO<Unit>) => {
        this.units = page.items;
        this.filteredUnits = [...this.units];
        this.totalCount = page.totalCount;
        this.totalPages = page.totalPages;
        this.updatePageNumbers();
        this.loading = false;
      },
      error: () => {
        this.mensagemErro = 'Erro ao carregar unidades.';
        this.loading = false;
      }
    });
  }

  onSearch() {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredUnits = this.units.filter(unit =>
      unit.name.toLowerCase().includes(term) ||
      unit.abbreviation.toLowerCase().includes(term)
    );
  }

  updatePageNumbers() {
    const maxVisible = 5;
    const pages: number[] = [];

    if (this.totalPages <= maxVisible) {
      for (let i = 0; i < this.totalPages; i++) pages.push(i);
    } else {
      const start = Math.max(0, this.currentPage - 2);
      const end = Math.min(this.totalPages, start + maxVisible);

      if (start > 0) pages.push(0);
      if (start > 1) pages.push(-1);
      for (let i = start; i < end; i++) pages.push(i);
      if (end < this.totalPages - 1) pages.push(-1);
      if (end < this.totalPages) pages.push(this.totalPages - 1);
    }
    this.pageNumbers = pages;
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadUnits();
    }
  }

  toggleEdit(id: number | null) {
    this.editModeId = id;
    this.formSubmitted = false;
    if (id) {
      const unit = this.units.find(u => u.id === id);
      if (unit) {
        this.formGroup.patchValue({
          name: unit.name,
          abbreviation: unit.abbreviation,
          description: unit.description
        });
      }
    } else {
      this.formGroup.reset();
    }
  }

  salvar(id: number | null) {
    this.formSubmitted = true;
    if (this.formGroup.valid) {
      this.carregandoForm = true;
      const payload = this.formGroup.value;

      const obs$ = id
        ? this.utilsService.atualizarUnit(id, payload)
        : this.utilsService.adicionarUnit(payload);

      obs$.subscribe({
        next: () => {
          this.mensagemSucesso = id ? 'Unidade atualizada!' : 'Unidade adicionada!';
          this.loadUnits();
          this.toggleEdit(null);
          setTimeout(() => this.mensagemSucesso = '', 3000);
        },
        error: (err) => {
          this.mensagemErro = err.error?.message || (id ? 'Erro ao atualizar.' : 'Erro ao adicionar.');
          setTimeout(() => this.mensagemErro = '', 5000);
        },
        complete: () => this.carregandoForm = false
      });
    }
  }

  confirmarDeletar(id: number, name: string) {
    this.utilsService.checkUnitUsage(id).subscribe({
      next: (data: PageDTO<any>) => {
        if (data.totalCount > 0) {
          this.mensagemErro = 'Unidade em uso por consumíveis. Não pode ser deletada.';
          setTimeout(() => this.mensagemErro = '', 4000);
          return;
        }

        // Modal com novo padrão
        this.modalService.showConfirmation(
          'Excluir Unidade',
          `Tem certeza que deseja excluir a unidade "<strong>${name}</strong>"?`,
          { nid: id, name: `U${id}`, type: 'unit' } // name opcional (pode ser usado em logs)
        );
      },
      error: () => {
        this.mensagemErro = 'Erro ao verificar uso da unidade.';
        setTimeout(() => this.mensagemErro = '', 4000);
      }
    });
  }

  deletar(id: number) {
    this.utilsService.deletarUnit(id).subscribe({
      next: () => {
        this.mensagemSucesso = 'Unidade excluída com sucesso!';
        this.loadUnits();
        setTimeout(() => this.mensagemSucesso = '', 3000);
      },
      error: (err) => {
        this.mensagemErro = err.error?.message || 'Erro ao excluir unidade.';
        setTimeout(() => this.mensagemErro = '', 5000);
      }
    });
  }
}