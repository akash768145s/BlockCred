package handlers

import (
	"encoding/json"
	"net/http"

	httpx "blockcred-backend/internal/http"
	"blockcred-backend/internal/models"
	"blockcred-backend/internal/services"
	"blockcred-backend/internal/store"

	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// RBACAdminHandler exposes admin-only configuration APIs for roles, departments, and credential types.
type RBACAdminHandler struct {
	Store store.Store
}

func (h *RBACAdminHandler) getCurrentUser(r *http.Request) (models.User, bool) {
	u, ok := r.Context().Value("user").(models.User)
	return u, ok
}

func (h *RBACAdminHandler) requirePermission(w http.ResponseWriter, r *http.Request, permission string) (*services.RBACService, *models.User, bool) {
	user, ok := h.getCurrentUser(r)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return nil, nil, false
	}

	// Backward-compatibility: legacy SSN main admin can always access config endpoints
	if user.Role == models.RoleSSNMainAdmin {
		return services.NewRBACService(h.Store), &user, true
	}

	rbac := services.NewRBACService(h.Store)
	has, err := rbac.HasPermission(user, permission)
	if err != nil {
		httpx.JSON(w, http.StatusForbidden, false, err.Error(), nil)
		return nil, nil, false
	}
	if !has {
		httpx.JSON(w, http.StatusForbidden, false, "insufficient permissions", nil)
		return nil, nil, false
	}
	return rbac, &user, true
}

// ==== Role endpoints ====

func (h *RBACAdminHandler) ListRoles(w http.ResponseWriter, r *http.Request) {
	if _, _, ok := h.requirePermission(w, r, "manage_roles"); !ok {
		return
	}
	roles, err := h.Store.ListRoles()
	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, "failed to list roles", nil)
		return
	}
	httpx.JSON(w, http.StatusOK, true, "roles retrieved", roles)
}

func (h *RBACAdminHandler) CreateRole(w http.ResponseWriter, r *http.Request) {
	if _, _, ok := h.requirePermission(w, r, "manage_roles"); !ok {
		return
	}
	var in struct {
		Name               string   `json:"name"`
		Description        string   `json:"description"`
		DepartmentID       string   `json:"department_id"`
		CanIssueCredentials bool    `json:"can_issue_credentials"`
		Permissions        []string `json:"permissions"`
		DashboardRoute     string   `json:"dashboard_route"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		httpx.JSON(w, http.StatusBadRequest, false, "invalid request", nil)
		return
	}

	role := models.Role{
		Name:               in.Name,
		Description:        in.Description,
		CanIssueCredentials: in.CanIssueCredentials,
		Permissions:        in.Permissions,
		DashboardRoute:     in.DashboardRoute,
	}

	if in.DepartmentID != "" {
		oid, err := primitive.ObjectIDFromHex(in.DepartmentID)
		if err == nil {
			role.DepartmentID = &oid
		}
	}

	created, err := h.Store.CreateRole(role)
	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, err.Error(), nil)
		return
	}
	httpx.JSON(w, http.StatusCreated, true, "role created", created)
}

func (h *RBACAdminHandler) DeleteRole(w http.ResponseWriter, r *http.Request) {
	if _, _, ok := h.requirePermission(w, r, "manage_roles"); !ok {
		return
	}
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		httpx.JSON(w, http.StatusBadRequest, false, "role ID required", nil)
		return
	}
	if err := h.Store.DeleteRole(id); err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, err.Error(), nil)
		return
	}
	httpx.JSON(w, http.StatusOK, true, "role deleted", nil)
}

func (h *RBACAdminHandler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	if _, _, ok := h.requirePermission(w, r, "manage_roles"); !ok {
		return
	}
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		httpx.JSON(w, http.StatusBadRequest, false, "role ID required", nil)
		return
	}
	var in struct {
		Name                string   `json:"name"`
		Description         string   `json:"description"`
		DepartmentID        string   `json:"department_id"`
		CanIssueCredentials bool    `json:"can_issue_credentials"`
		Permissions         []string `json:"permissions"`
		DashboardRoute      string   `json:"dashboard_route"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		httpx.JSON(w, http.StatusBadRequest, false, "invalid request", nil)
		return
	}

	role := models.Role{
		Name:                in.Name,
		Description:         in.Description,
		CanIssueCredentials: in.CanIssueCredentials,
		Permissions:         in.Permissions,
		DashboardRoute:      in.DashboardRoute,
	}
	if in.DepartmentID != "" {
		oid, err := primitive.ObjectIDFromHex(in.DepartmentID)
		if err == nil {
			role.DepartmentID = &oid
		}
	}

	updated, err := h.Store.UpdateRole(id, role)
	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, err.Error(), nil)
		return
	}
	httpx.JSON(w, http.StatusOK, true, "role updated", updated)
}

// ==== Department endpoints ====

// ListPublicDepartments returns only academic departments; no auth required (for registration, etc.).
func (h *RBACAdminHandler) ListPublicDepartments(w http.ResponseWriter, r *http.Request) {
	depts, err := h.Store.ListDepartments()
	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, "failed to list departments", nil)
		return
	}
	academic := make([]models.Department, 0, len(depts))
	for _, d := range depts {
		if d.AcademicDepartment {
			academic = append(academic, d)
		}
	}
	httpx.JSON(w, http.StatusOK, true, "departments retrieved", academic)
}

func (h *RBACAdminHandler) ListDepartments(w http.ResponseWriter, r *http.Request) {
	if _, _, ok := h.requirePermission(w, r, "manage_departments"); !ok {
		return
	}
	depts, err := h.Store.ListDepartments()
	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, "failed to list departments", nil)
		return
	}
	httpx.JSON(w, http.StatusOK, true, "departments retrieved", depts)
}

func (h *RBACAdminHandler) CreateDepartment(w http.ResponseWriter, r *http.Request) {
	if _, _, ok := h.requirePermission(w, r, "manage_departments"); !ok {
		return
	}
	var in struct {
		Name                string `json:"name"`
		Description         string `json:"description"`
		AcademicDepartment  bool   `json:"academic_department"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		httpx.JSON(w, http.StatusBadRequest, false, "invalid request", nil)
		return
	}
	dept := models.Department{
		Name:                in.Name,
		Description:         in.Description,
		AcademicDepartment:  in.AcademicDepartment,
	}
	created, err := h.Store.CreateDepartment(dept)
	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, err.Error(), nil)
		return
	}
	httpx.JSON(w, http.StatusCreated, true, "department created", created)
}

func (h *RBACAdminHandler) UpdateDepartment(w http.ResponseWriter, r *http.Request) {
	if _, _, ok := h.requirePermission(w, r, "manage_departments"); !ok {
		return
	}
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		httpx.JSON(w, http.StatusBadRequest, false, "department ID required", nil)
		return
	}
	var in struct {
		Name               string `json:"name"`
		Description        string `json:"description"`
		AcademicDepartment bool   `json:"academic_department"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		httpx.JSON(w, http.StatusBadRequest, false, "invalid request", nil)
		return
	}
	updates := models.Department{
		Name:               in.Name,
		Description:        in.Description,
		AcademicDepartment: in.AcademicDepartment,
	}
	updated, err := h.Store.UpdateDepartment(id, updates)
	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, err.Error(), nil)
		return
	}
	httpx.JSON(w, http.StatusOK, true, "department updated", updated)
}

func (h *RBACAdminHandler) DeleteDepartment(w http.ResponseWriter, r *http.Request) {
	if _, _, ok := h.requirePermission(w, r, "manage_departments"); !ok {
		return
	}
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		httpx.JSON(w, http.StatusBadRequest, false, "department ID required", nil)
		return
	}
	if err := h.Store.DeleteDepartment(id); err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, err.Error(), nil)
		return
	}
	httpx.JSON(w, http.StatusOK, true, "department deleted", nil)
}

// ==== Credential type endpoints ====

// ListPublicCredentialTypes returns all credential types with id, name, and fields for display (e.g. student dashboard). No auth required.
func (h *RBACAdminHandler) ListPublicCredentialTypes(w http.ResponseWriter, r *http.Request) {
	cts, err := h.Store.ListCredentialTypes()
	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, "failed to list credential types", nil)
		return
	}
	httpx.JSON(w, http.StatusOK, true, "credential types retrieved", cts)
}

func (h *RBACAdminHandler) ListCredentialTypes(w http.ResponseWriter, r *http.Request) {
	if _, _, ok := h.requirePermission(w, r, "manage_credential_types"); !ok {
		return
	}
	cts, err := h.Store.ListCredentialTypes()
	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, "failed to list credential types", nil)
		return
	}
	httpx.JSON(w, http.StatusOK, true, "credential types retrieved", cts)
}

func (h *RBACAdminHandler) CreateCredentialType(w http.ResponseWriter, r *http.Request) {
	if _, _, ok := h.requirePermission(w, r, "manage_credential_types"); !ok {
		return
	}
	var in struct {
		Name        string                    `json:"name"`
		Description string                    `json:"description"`
		RoleIDs     []string                  `json:"role_ids"`
		Fields      []models.CredentialFieldConfig `json:"fields"` // optional dynamic form schema
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		httpx.JSON(w, http.StatusBadRequest, false, "invalid request", nil)
		return
	}

	roleOIDs, err := services.BuildObjectIDSlice(in.RoleIDs)
	if err != nil {
		httpx.JSON(w, http.StatusBadRequest, false, err.Error(), nil)
		return
	}

	ct := models.CredentialTypeConfig{
		Name:          in.Name,
		Description:   in.Description,
		IssuerRoleIDs: roleOIDs,
		Fields:        in.Fields,
	}

	created, err := h.Store.CreateCredentialType(ct)
	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, err.Error(), nil)
		return
	}
	httpx.JSON(w, http.StatusCreated, true, "credential type created", created)
}

func (h *RBACAdminHandler) UpdateCredentialType(w http.ResponseWriter, r *http.Request) {
	if _, _, ok := h.requirePermission(w, r, "manage_credential_types"); !ok {
		return
	}
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		httpx.JSON(w, http.StatusBadRequest, false, "credential type ID required", nil)
		return
	}
	var in struct {
		Name        string                    `json:"name"`
		Description string                    `json:"description"`
		RoleIDs     []string                  `json:"role_ids"`
		Fields      []models.CredentialFieldConfig `json:"fields"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		httpx.JSON(w, http.StatusBadRequest, false, "invalid request", nil)
		return
	}

	roleOIDs, err := services.BuildObjectIDSlice(in.RoleIDs)
	if err != nil {
		httpx.JSON(w, http.StatusBadRequest, false, err.Error(), nil)
		return
	}

	updates := models.CredentialTypeConfig{
		Name:          in.Name,
		Description:   in.Description,
		IssuerRoleIDs: roleOIDs,
		Fields:        in.Fields,
	}

	updated, err := h.Store.UpdateCredentialType(id, updates)
	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, err.Error(), nil)
		return
	}
	httpx.JSON(w, http.StatusOK, true, "credential type updated", updated)
}

func (h *RBACAdminHandler) DeleteCredentialType(w http.ResponseWriter, r *http.Request) {
	if _, _, ok := h.requirePermission(w, r, "manage_credential_types"); !ok {
		return
	}
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		httpx.JSON(w, http.StatusBadRequest, false, "credential type ID required", nil)
		return
	}
	if err := h.Store.DeleteCredentialType(id); err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, err.Error(), nil)
		return
	}
	httpx.JSON(w, http.StatusOK, true, "credential type deleted", nil)
}

