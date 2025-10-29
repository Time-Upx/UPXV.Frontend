import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConsumableService, Consumable, ConsumableCreateDTO } from '../../services/consumable.service';
import { UtilsService, PageDTO, Unit, Tag } from '../../services/utils.service';
import { ModalService, ModalActionItem } from '../../services/modal.service';
import QRCode from 'qrcode';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-consumable-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './consumable-detail.component.html',
  styleUrls: ['./consumable-detail.component.css']
})
export class ConsumableDetailComponent implements OnInit, OnDestroy {
  item: Consumable = {} as Consumable;
  carregando = true;
  qrCodeUrl = '';
  mostrandoQrCode = false;
  baseUrl = window.location.origin;
  editMode = false;
  mensagemErro = '';
  mensagemSucesso = '';
  carregandoEdit = false;
  formSubmitted = false;
  editForm: FormGroup;
  units: Unit[] = [];
  tags: Tag[] = [];
  showAddTagInput = false;
  newTagName = '';
  newTagDescription = '';
  carregandoTag = false;
  selectedTagIds: number[] = [];

  private subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: ConsumableService,
    private utilsService: UtilsService,
    private modalService: ModalService,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      quantity: [0, [Validators.required, Validators.min(0.01)]],
      unitId: ['', Validators.required]
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadItem(+id);
      this.loadUnits();
      this.loadTags();
    } else {
      this.router.navigate(['/consumables']);
    }

    this.subscription.add(
      this.modalService.onConfirm().subscribe((item: ModalActionItem) => {
        if (item.type === 'consumable' && item.nid === this.item.id) {
          this.deletar(item.nid);
        } else if (item.type === 'tag') {
          this.deletarTag(item.nid);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadItem(id: number) {
    this.carregando = true;
    this.service.getById(id).subscribe({
      next: (data: Consumable) => {
        this.item = data;
        this.selectedTagIds = data.tags?.map(t => t.id) || [];
        this.populateEditForm();
        this.carregando = false;
      },
      error: () => {
        this.mensagemErro = 'Erro ao carregar consumível.';
        setTimeout(() => this.router.navigate(['/consumables']), 2000);
      }
    });
  }

  loadUnits() {
    this.utilsService.listarUnits(0, 100).subscribe({
      next: (page: PageDTO<Unit>) => this.units = page.items,
      error: () => this.units = []
    });
  }

  loadTags() {
    this.utilsService.listarTags(0, 200).subscribe({
      next: (page: PageDTO<Tag>) => this.tags = page.items,
      error: () => {
        this.mensagemErro = 'Erro ao carregar tags.';
        this.tags = [];
      }
    });
  }

  populateEditForm() {
    this.editForm.patchValue({
      name: this.item.name,
      description: this.item.description,
      quantity: this.item.quantity,
      unitId: this.item.unit?.id
    });
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.populateEditForm();
    } else {
      this.formSubmitted = false;
      this.mensagemErro = '';
      this.mensagemSucesso = '';
      this.showAddTagInput = false;
    }
  }

  atualizar() {
    this.formSubmitted = true;
    if (this.editForm.valid) {
      this.carregandoEdit = true;
      const payload: Partial<ConsumableCreateDTO> = {
        name: this.editForm.value.name,
        description: this.editForm.value.description,
        quantity: +this.editForm.value.quantity,
        unitId: +this.editForm.value.unitId,
        tagIds: this.selectedTagIds
      };

      this.service.atualizar(this.item.id, payload).subscribe({
        next: (updated: Consumable) => {
          this.item = updated;
          this.selectedTagIds = updated.tags?.map(t => t.id) || [];
          this.mensagemSucesso = 'Consumível atualizado!';
          this.toggleEdit();
          setTimeout(() => this.mensagemSucesso = '', 3000);
        },
        error: (err) => {
          this.mensagemErro = err.error?.message || 'Erro ao atualizar.';
          setTimeout(() => this.mensagemErro = '', 5000);
        },
        complete: () => this.carregandoEdit = false
      });
    }
  }

  toggleAddTagInput() {
    this.showAddTagInput = !this.showAddTagInput;
    if (!this.showAddTagInput) {
      this.newTagName = '';
      this.newTagDescription = '';
    }
  }

  adicionarTag() {
    const name = this.newTagName.trim();
    if (!name) {
      this.mensagemErro = 'Nome da tag é obrigatório.';
      setTimeout(() => this.mensagemErro = '', 3000);
      return;
    }

    if (this.tags.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      this.mensagemErro = 'Tag já existe.';
      setTimeout(() => this.mensagemErro = '', 3000);
      return;
    }

    this.carregandoTag = true;
    const payload = { name, description: this.newTagDescription.trim() || '' };

    this.utilsService.adicionarTag(payload).subscribe({
      next: () => {
        this.mensagemSucesso = 'Tag adicionada!';
        this.loadTags();
        this.toggleAddTagInput();
        setTimeout(() => this.mensagemSucesso = '', 3000);
      },
      error: () => {
        this.mensagemErro = 'Erro ao adicionar tag.';
        setTimeout(() => this.mensagemErro = '', 5000);
      },
      complete: () => this.carregandoTag = false
    });
  }

  confirmarDeletarTag(id: number, name: string) {
    this.modalService.showConfirmation(
      'Excluir Tag',
      `Deseja excluir "<strong>${name}</strong>"?`,
      { nid: id, name: name, type: 'tag' }
    );
  }

  deletarTag(id: number) {
    this.utilsService.deletarTag(id).subscribe({
      next: () => {
        this.mensagemSucesso = 'Tag excluída!';
        this.loadTags();
        this.selectedTagIds = this.selectedTagIds.filter(t => t !== id);
        setTimeout(() => this.mensagemSucesso = '', 3000);
      },
      error: () => {
        this.mensagemErro = 'Erro ao excluir tag.';
        setTimeout(() => this.mensagemErro = '', 5000);
      }
    });
  }

  toggleAssignTag(tagId: number) {
    this.selectedTagIds = this.selectedTagIds.includes(tagId)
      ? this.selectedTagIds.filter(id => id !== tagId)
      : [...this.selectedTagIds, tagId];
  }

  isAssigned(tagId: number): boolean {
    return this.selectedTagIds.includes(tagId);
  }

  gerarQrCode() {
    const link = `${this.baseUrl}/consumables/${this.item.id}`;
    QRCode.toDataURL(link, { width: 300, margin: 1, errorCorrectionLevel: 'H' })
      .then(url => {
        this.qrCodeUrl = url;
        this.mostrandoQrCode = true;
      })
      .catch(() => this.mensagemErro = 'Erro ao gerar QR Code.');
  }

  fecharQrCode() {
    this.mostrandoQrCode = false;
    this.qrCodeUrl = '';
  }

  imprimirQrCode() {
    if (!this.qrCodeUrl) return;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code - ${this.item.name}</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              img { max-width: 200px; margin: 20px 0; }
            </style>
          </head>
          <body onload="window.print(); window.close()">
            <h2>${this.item.name}</h2>
            <img src="${this.qrCodeUrl}" />
            <p><small>${this.baseUrl}/consumables/${this.item.id}</small></p>
          </body>
        </html>
      `);
      win.document.close();
    }
  }

  confirmarDeletar(id: number, name: string) {
    this.modalService.showConfirmation(
      'Excluir Consumível',
      `Deseja excluir "<strong>${name}</strong>"?`,
      { nid: id, name, type: 'consumable' }
    );
  }

  deletar(id: number) {
    this.service.deletar(id).subscribe({
      next: () => this.router.navigate(['/consumables']),
      error: () => {
        this.mensagemErro = 'Erro ao deletar consumível.';
        setTimeout(() => this.mensagemErro = '', 5000);
      }
    });
  }
}