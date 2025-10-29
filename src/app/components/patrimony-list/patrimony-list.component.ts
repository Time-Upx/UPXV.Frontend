import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PatrimonyService } from '../../services/patrimony.service';
import { UtilsService, PageDTO, Status } from '../../services/utils.service';
import { ModalService, ModalActionItem } from '../../services/modal.service';
import { Subscription } from 'rxjs';
import { Patrimony, PatrimonyCreateDTO } from '../../services/patrimony.service';

@Component({
  selector: 'app-patrimony-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './patrimony-list.component.html',
  styleUrls: ['./patrimony-list.component.css']
})
export class PatrimonyListComponent implements OnInit, OnDestroy {
  patrimonies: Patrimony[] = [];
  filteredPatrimonies: Patrimony[] = [];
  statuses: Status[] = [];
  searchTerm = '';
  formVisible = false;
  mensagemErro = '';
  mensagemSucesso = '';
  formSubmitted = false;
  carregandoForm = false;
  loading = false;

  // Paginação
  currentPage = 0;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  pageNumbers: number[] = [];

  formGroup: FormGroup;
  private subscription = new Subscription();

  constructor(
    private patrimonyService: PatrimonyService,
    private utilsService: UtilsService,
    private fb: FormBuilder,
    private modalService: ModalService
  ) {
    this.formGroup = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      registeredBy: [''],
      statusId: ['', Validators.required],
      tagIds: ['']
    });
  }

  ngOnInit() {
    this.loadPatrimonies();
    this.loadStatuses();

    this.subscription.add(
      this.modalService.onConfirm().subscribe((item: ModalActionItem) => {
        if (item.type === 'patrimony') {
          this.deletar(item.nid);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadPatrimonies() {
    this.loading = true;
    this.mensagemErro = '';

    this.patrimonyService.listar(this.currentPage, this.pageSize).subscribe({
      next: (page: PageDTO<Patrimony>) => {
        this.patrimonies = page.items;
        this.filteredPatrimonies = [...this.patrimonies];
        this.totalCount = page.totalCount;
        this.totalPages = page.totalPages;
        this.updatePageNumbers();
        this.loading = false;
      },
      error: () => {
        this.mensagemErro = 'Erro ao carregar patrimônios.';
        this.loading = false;
      }
    });
  }

  loadStatuses() {
    this.utilsService.listarStatuses(0, 100).subscribe({
      next: (page: PageDTO<Status>) => {
        this.statuses = page.items;
      },
      error: () => {
        this.mensagemErro = 'Erro ao carregar status.';
        this.statuses = [];
      }
    });
  }

  onSearch() {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredPatrimonies = this.patrimonies.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term)) ||
      (p.status?.name && p.status.name.toLowerCase().includes(term)) ||
      (p.tags?.some(tag => tag.name.toLowerCase().includes(term)) ?? false)
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
      this.loadPatrimonies();
    }
  }

  toggleForm() {
    this.formVisible = !this.formVisible;
    if (!this.formVisible) {
      this.formGroup.reset();
      this.formSubmitted = false;
    }
  }

  criar() {
    this.formSubmitted = true;
    if (this.formGroup.valid) {
      this.carregandoForm = true;
      const payload = {
        name: this.formGroup.value.name,
        description: this.formGroup.value.description,
        registeredBy: this.formGroup.value.registeredBy,
        statusId: parseInt(this.formGroup.value.statusId),
        tagIds: this.formGroup.value.tagIds
          ? this.formGroup.value.tagIds.split(',').map((id: string) => parseInt(id.trim())).filter((id: number) => !isNaN(id))
          : []
      };

      this.patrimonyService.criar(payload).subscribe({
        next: () => {
          this.mensagemSucesso = 'Patrimônio criado com sucesso!';
          this.loadPatrimonies();
          this.toggleForm();
          setTimeout(() => this.mensagemSucesso = '', 3000);
        },
        error: (err) => {
          this.mensagemErro = err.error?.message || 'Erro ao criar patrimônio.';
          setTimeout(() => this.mensagemErro = '', 5000);
        },
        complete: () => this.carregandoForm = false
      });
    }
  }

  confirmarDeletar(id: number, name: string) {
    this.modalService.showConfirmation(
      'Excluir Patrimônio',
      `Tem certeza que deseja excluir o item "<strong>${name}</strong>"?`,
      { nid: id, name: `P${id}`, type: 'patrimony' }
    );
  }

  deletar(id: number) {
    this.patrimonyService.deletar(id).subscribe({
      next: () => {
        this.mensagemSucesso = 'Patrimônio excluído com sucesso!';
        this.loadPatrimonies();
        setTimeout(() => this.mensagemSucesso = '', 3000);
      },
      error: (err) => {
        this.mensagemErro = err.error?.message || 'Erro ao excluir patrimônio.';
        setTimeout(() => this.mensagemErro = '', 5000);
      }
    });
  }
}