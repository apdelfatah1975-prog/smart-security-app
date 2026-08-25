type RemoteDate = string | number | Date | null | undefined;

const day = (value: RemoteDate) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const text = (value: unknown) => (value === null || value === undefined ? "" : String(value));

export type SmartSnapshot = {
  staff: any[];
  workLocations: any[];
  attendance: any[];
  patrols: any[];
  patrolPlans: any[];
  entries: any[];
  debts: any[];
  children: any[];
  teachers: any[];
  lessons: any[];
  vehicles: any[];
  vehicleVisits: any[];
};

export function mapSmartSnapshot(remote: SmartSnapshot) {
  const staff = remote.staff.map(item => ({
    id: text(item.id),
    code: text(item.staffCode),
    name: text(item.fullName),
    phone: text(item.phone),
    nationalId: text(item.nationalId),
    branch: text(item.branch),
    workStartDate: day(item.workStartDate),
    hireDate: day(item.hireDate),
    active: Boolean(item.isActive),
    shift: text(item.shift) || "morning",
    emergencyPhone: text(item.emergencyPhone),
    image: text(item.photoUrl),
    notes: text(item.notes),
    licenseStatus: item.licenseStatus === "licensed" ? "licensed" : "unlicensed",
    weaponNumber: text(item.weaponNumber),
    licenseNumber: text(item.licenseNumber),
    licenseExpiry: day(item.licenseExpiry),
    retirementDate: day(item.retirementDate),
  }));

  return {
    staff,
    workLocations: remote.workLocations.map(item => ({ id: text(item.id), staffId: text(item.staffId), location: text(item.locationName), fromDate: day(item.fromDate), toDate: day(item.toDate), reason: text(item.transferReason), notes: text(item.notes) })),
    attendance: remote.attendance.map(item => ({ id: text(item.id), staffId: text(item.staffId), date: day(item.attendanceDate), shift: text(item.shift), status: text(item.status), hours: Number(item.hours) || 0 })),
    patrols: remote.patrols.map(item => ({ id: text(item.id), staffId: item.staffId ? text(item.staffId) : "", branch: text(item.branch), date: day(item.patrolDate), checkpoint: text(item.checkpoint), notes: text(item.notes), photo: text(item.photoUrl) })),
    patrolPlans: remote.patrolPlans.map(item => ({ id: text(item.id), date: day(item.planDate), branch: text(item.branch), checkpoint: text(item.checkpoint), staffId: item.staffId ? text(item.staffId) : "", shift: text(item.shift), notes: text(item.notes), repeatWeekly: Boolean(item.repeatWeekly) })),
    entries: remote.entries.map(item => ({ id: text(item.id), type: item.entryType === "expense" ? "expense" : "income", category: text(item.category), amount: Number(item.amount) || 0, date: day(item.entryDate), notes: text(item.description) })),
    debts: remote.debts.map(item => ({ id: text(item.id), name: text(item.personName), direction: item.direction === "payable" ? "payable" : "receivable", total: Number(item.totalAmount) || 0, paid: Number(item.paidAmount) || 0, due: day(item.dueDate), notes: text(item.notes) })),
    children: remote.children.map(item => ({ id: text(item.id), name: text(item.fullName), grade: text(item.grade), school: text(item.school), phone: text(item.phone) })),
    teachers: remote.teachers.map(item => ({ id: text(item.id), name: text(item.fullName), subject: text(item.subject), phone: text(item.phone), cost: Number(item.monthlyCost) || 0 })),
    lessons: remote.lessons.map(item => ({ id: text(item.id), childId: text(item.childId), teacherId: item.teacherId ? text(item.teacherId) : "", subject: text(item.subject), date: day(item.lessonDate), cost: Number(item.cost) || 0, status: item.status === "completed" ? "completed" : "scheduled" })),
    vehicles: remote.vehicles.map(item => ({ id: text(item.id), type: item.vehicleType, customType: text(item.customType), make: text(item.make), model: text(item.model), color: text(item.color), plate: text(item.plateNumber), vin: text(item.vin), purchaseDate: day(item.purchaseDate), saleDate: day(item.saleDate), ownership: item.ownership, licenseStatus: item.licenseStatus, licenseNumber: text(item.licenseNumber), licenseExpiry: day(item.licenseExpiry), licenseWithdrawnDate: day(item.licenseWithdrawnDate), licenseWithdrawalReason: text(item.licenseWithdrawalReason), notes: text(item.notes) })),
    vehicleVisits: remote.vehicleVisits.map(item => ({ id: text(item.id), vehicleId: text(item.vehicleId), date: day(item.visitDate), kind: item.visitType, result: text(item.result), nextDue: day(item.nextDueDate), fees: Number(item.fees) || 0, notes: text(item.notes) })),
  };
}

export function hasRecords(state: Record<string, unknown>) {
  return Object.entries(state).some(([key, value]) => key !== "settings" && Array.isArray(value) && value.length > 0);
}
