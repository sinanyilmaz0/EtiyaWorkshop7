import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { CategoriesService } from 'src/app/features/category/services/categories.service';
import { Category } from 'src/app/shared/models/category';
import { Products } from 'src/app/shared/models/product';
import { ProductsService } from 'src/app/features/product/services/products.service';
import { Supplier } from 'src/app/shared/models/supplier';
import { SupplierServiceService } from 'src/app/shared/services/supplier-service.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent implements OnInit {
  productForm!: FormGroup;
  productToUpdate: Products | null = null;
  categories: Category[] = [];
  suppliers: Supplier[] = [];

  get isEditting(): boolean {
    return this.productToUpdate !== null;
  }

  constructor(
    private formBuilder: FormBuilder,
    private productsService: ProductsService,
    private toastrService: ToastrService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private categoriesService: CategoriesService,
    private supliersService: SupplierServiceService
  ) {
    // this.productForm = new FormGroup({
    //   name: new FormControl(''),
    // });
  }

  ngOnInit(): void {
    this.getSuppliers();
    this.getCategories();
    this.createProductForm();
    this.getProductIdFromRoute();
  }

  createProductForm(): void {
    this.productForm = this.formBuilder.group({
      supplierId: [0, Validators.min(1)],
      categoryId: [0, Validators.min(1)],
      quantityPerUnit: ['', Validators.required],
      unitPrice: [0, Validators.min(0)],
      unitsInStock: [0, Validators.min(0)],
      unitsOnOrder: ['', Validators.min(0)],
      reorderLevel: ['', Validators.min(0)],
      discontinued: [false],
      name: ['', [Validators.required, Validators.minLength(2)]], //: array, form control'ün parametrelerini temsil eder. 1. eleman default değer, 2. eleman validators
    });
  }

  getCategories(): void {
    this.categoriesService.getList().subscribe((response: Category[]) => {
      this.categories = response;
    });
  }

  getSuppliers(): void {
    this.supliersService.getList().subscribe((response: Supplier[]) => {
      this.suppliers = response;
    });
  }

  getProductIdFromRoute(): void {
    this.activatedRoute.params.subscribe((params) => {
      if (params['productId']) this.getProductById(params['productId']);
    });
  }

  getProductById(productId: number) {
    this.productsService.getById(productId).subscribe({
      next: (response) => {
        this.productToUpdate = response;
        this.productForm.patchValue(this.productToUpdate); //: Formun içine productToUpdate modelini doldurur.
      },
      error: () => {
        this.toastrService.error('Product not found');
        this.router.navigate(['/dashboard', 'products']);
      },
    });
  }

  onProductFormSubmit(): void {
    if (this.productForm.invalid) {
      this.toastrService.error('Please fill in the form correctly');
      return;
    }

    if (this.isEditting) this.update();
    else this.add();
  }

  onDeleteProduct(): void {
    if (confirm('Are you sure you want to delete this product?') === false)
      return;

    this.delete();
  }

  add(): void {
    const request: Products = {
      //: Backend'in product add endpoint'ine gönderilecek olan request modeli.
      ...this.productForm.value,
      categoryId: Number(this.productForm.value.categoryId),
      supplierId: Number(this.productForm.value.supplierId),
      name: this.productForm.value.name.trim(), //= ...this.productForm.value ile gelen 'name' değerinin üzerin tekrar yazıyoruz (overwrite).
    };

    this.productsService.add(request).subscribe((response) => {
      this.toastrService.success('Product added successfully');
      this.router.navigate(['/dashboard', 'products', 'edit', response.id]);
    });
  }

  update(): void {
    const request: Products = {
      id: this.productToUpdate!.id,
      categoryId: Number.parseInt(this.productForm.value.categoryId),
      supplierId: Number.parseInt(this.productForm.value.supplierId),
      quantityPerUnit: this.productForm.value.quantityPerUnit,
      unitPrice: Number.parseFloat(this.productForm.value.unitPrice),
      unitsInStock: Number.parseInt(this.productForm.value.unitsInStock),
      unitsOnOrder: Number.parseInt(this.productForm.value.unitsOnOrder),
      reorderLevel: Number.parseInt(this.productForm.value.reorderLevel),
      discontinued: Boolean(this.productForm.value.discontinued),
      name: this.productForm.value.name.trim(),
    };

    this.productsService.update(request).subscribe((response) => {
      this.productToUpdate = response;
      this.toastrService.success('Product updated successfully');
    });
  }

  delete(): void {
    this.productsService.delete(this.productToUpdate!.id).subscribe(() => {
      this.toastrService.success('Product deleted successfully');
      this.router.navigate(['/dashboard', 'products']);
    });
  }
}