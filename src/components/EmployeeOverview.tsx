import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Star, FileText, Eye, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface EmployeeData {
  worker_first_name: string;
  worker_last_name: string;
  total_assignments: number;
  completed_assignments: number;
  evaluated_assignments: number;
  average_rating: number;
  latest_assignment_date: string;
  assignments: Assignment[];
}

interface Assignment {
  id: string;
  auftrag_title: string;
  auftrag_auftragsnummer: string;
  is_completed: boolean;
  is_evaluated: boolean;
  created_at: string;
  updated_at: string;
  average_rating?: number;
  evaluation_count?: number;
  is_actually_completed?: boolean; // New field to track if assignment is truly completed (evaluated)
}

const EmployeeOverview = () => {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeData | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'assignments' | 'rating' | 'completion'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
    try {
      // Fetch all assignments with related auftrag data
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('auftrag_assignments')
        .select(`
          id,
          worker_first_name,
          worker_last_name,
          is_completed,
          is_evaluated,
          created_at,
          updated_at,
          auftraege!inner(title, auftragsnummer)
        `)
        .order('created_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Fetch evaluation data
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from('evaluations')
        .select(`
          assignment_id,
          star_rating
        `);

      if (evaluationsError) throw evaluationsError;

      // Process the data to group by employee
      const employeeMap = new Map<string, EmployeeData>();

      assignmentsData?.forEach((assignment: any) => {
        const employeeKey = `${assignment.worker_first_name}_${assignment.worker_last_name}`;
        
        // Calculate evaluation data for this assignment
        const assignmentEvaluations = evaluationsData?.filter(evaluation => evaluation.assignment_id === assignment.id) || [];
        const averageRating = assignmentEvaluations.length > 0 
          ? assignmentEvaluations.reduce((sum, evaluation) => sum + evaluation.star_rating, 0) / assignmentEvaluations.length 
          : undefined;

        // An assignment is considered completed if it has been evaluated (has evaluations or is_evaluated is true)
        const isActuallyCompleted = assignment.is_evaluated || assignmentEvaluations.length > 0;

        const assignmentData: Assignment = {
          id: assignment.id,
          auftrag_title: assignment.auftraege.title,
          auftrag_auftragsnummer: assignment.auftraege.auftragsnummer,
          is_completed: assignment.is_completed,
          is_evaluated: assignment.is_evaluated,
          created_at: assignment.created_at,
          updated_at: assignment.updated_at,
          average_rating: averageRating,
          evaluation_count: assignmentEvaluations.length,
          is_actually_completed: isActuallyCompleted
        };

        if (employeeMap.has(employeeKey)) {
          const employee = employeeMap.get(employeeKey)!;
          employee.assignments.push(assignmentData);
          employee.total_assignments++;
          if (isActuallyCompleted) employee.completed_assignments++;
          if (assignment.is_evaluated) employee.evaluated_assignments++;
          
          // Update latest assignment date
          if (new Date(assignment.created_at) > new Date(employee.latest_assignment_date)) {
            employee.latest_assignment_date = assignment.created_at;
          }
        } else {
          employeeMap.set(employeeKey, {
            worker_first_name: assignment.worker_first_name,
            worker_last_name: assignment.worker_last_name,
            total_assignments: 1,
            completed_assignments: isActuallyCompleted ? 1 : 0,
            evaluated_assignments: assignment.is_evaluated ? 1 : 0,
            average_rating: 0,
            latest_assignment_date: assignment.created_at,
            assignments: [assignmentData]
          });
        }
      });

      // Calculate average ratings for each employee
      employeeMap.forEach((employee) => {
        const allRatings = employee.assignments
          .filter(a => a.average_rating !== undefined)
          .map(a => a.average_rating!);
        
        employee.average_rating = allRatings.length > 0
          ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length
          : 0;
      });

      setEmployees(Array.from(employeeMap.values()));
    } catch (error) {
      console.error('Error fetching employee data:', error);
      toast({
        title: "Fehler",
        description: "Mitarbeiterdaten konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSortedEmployees = () => {
    return [...employees].sort((a, b) => {
      let valueA: any, valueB: any;

      switch (sortBy) {
        case 'name':
          valueA = `${a.worker_first_name} ${a.worker_last_name}`;
          valueB = `${b.worker_first_name} ${b.worker_last_name}`;
          break;
        case 'assignments':
          valueA = a.total_assignments;
          valueB = b.total_assignments;
          break;
        case 'rating':
          valueA = a.average_rating;
          valueB = b.average_rating;
          break;
        case 'completion':
          valueA = a.total_assignments > 0 ? (a.completed_assignments / a.total_assignments) : 0;
          valueB = b.total_assignments > 0 ? (b.completed_assignments / b.total_assignments) : 0;
          break;
        default:
          valueA = a.worker_first_name;
          valueB = b.worker_first_name;
      }

      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });
  };

  const handleSort = (field: typeof sortBy) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getCompletionRate = (employee: EmployeeData) => {
    return employee.total_assignments > 0 
      ? Math.round((employee.completed_assignments / employee.total_assignments) * 100)
      : 0;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-40 mb-3" />
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mitarbeiter Übersicht</h2>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{employees.length}</p>
                <p className="text-sm text-gray-600">Aktive Mitarbeiter</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {employees.reduce((sum, emp) => sum + emp.total_assignments, 0)}
                </p>
                <p className="text-sm text-gray-600">Gesamt Zuweisungen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">
                  {employees.length > 0 
                    ? (employees.reduce((sum, emp) => sum + emp.average_rating, 0) / employees.length).toFixed(1)
                    : '0.0'
                  }
                </p>
                <p className="text-sm text-gray-600">Ø Bewertung</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {employees.reduce((sum, emp) => sum + emp.completed_assignments, 0)}
                </p>
                <p className="text-sm text-gray-600">Abgeschlossen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mitarbeiterliste</CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Keine Mitarbeiter gefunden.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('name')}
                  >
                    Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('assignments')}
                  >
                    Zuweisungen {sortBy === 'assignments' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('completion')}
                  >
                    Fertigstellung {sortBy === 'completion' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('rating')}
                  >
                    Bewertung {sortBy === 'rating' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Letzte Zuweisung</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getSortedEmployees().map((employee) => (
                  <TableRow key={`${employee.worker_first_name}_${employee.worker_last_name}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {employee.worker_first_name} {employee.worker_last_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Badge variant="outline">{employee.total_assignments} gesamt</Badge>
                        <Badge variant="secondary">{employee.completed_assignments} fertig</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getCompletionRate(employee) >= 80 ? "default" : "outline"}
                        className={getCompletionRate(employee) >= 80 ? "bg-green-100 text-green-800" : ""}
                      >
                        {getCompletionRate(employee)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {renderStars(Math.round(employee.average_rating))}
                        <span className="text-sm text-gray-600">
                          ({employee.average_rating.toFixed(1)})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {new Date(employee.latest_assignment_date).toLocaleDateString('de-DE')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedEmployee(employee)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              {employee.worker_first_name} {employee.worker_last_name} - Auftragsdetails
                            </DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-4 mt-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <Card>
                                <CardContent className="p-4">
                                  <div className="text-center">
                                    <p className="text-2xl font-bold">{employee.total_assignments}</p>
                                    <p className="text-sm text-gray-600">Gesamt</p>
                                  </div>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="p-4">
                                  <div className="text-center">
                                    <p className="text-2xl font-bold">{employee.completed_assignments}</p>
                                    <p className="text-sm text-gray-600">Abgeschlossen</p>
                                  </div>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="p-4">
                                  <div className="text-center">
                                    <p className="text-2xl font-bold">{employee.evaluated_assignments}</p>
                                    <p className="text-sm text-gray-600">Bewertet</p>
                                  </div>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="p-4">
                                  <div className="text-center">
                                    <p className="text-2xl font-bold">{employee.average_rating.toFixed(1)}</p>
                                    <p className="text-sm text-gray-600">Ø Bewertung</p>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>

                            <Card>
                              <CardHeader>
                                <CardTitle>Aufträge</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Auftrag</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Bewertung</TableHead>
                                      <TableHead>Erstellt</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {employee.assignments.map((assignment) => (
                                      <TableRow key={assignment.id}>
                                        <TableCell>
                                          <div>
                                            <p className="font-medium">{assignment.auftrag_title}</p>
                                            <p className="text-sm text-gray-600">
                                              {assignment.auftrag_auftragsnummer}
                                            </p>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex gap-2">
                                            <Badge 
                                              variant={assignment.is_actually_completed ? "default" : "outline"}
                                            >
                                              {assignment.is_actually_completed ? "Abgeschlossen" : "Offen"}
                                            </Badge>
                                            {assignment.is_evaluated && (
                                              <Badge variant="secondary">Bewertet</Badge>
                                            )}
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          {assignment.average_rating ? (
                                            <div className="flex items-center gap-2">
                                              {renderStars(Math.round(assignment.average_rating))}
                                              <span className="text-sm">
                                                ({assignment.average_rating.toFixed(1)})
                                              </span>
                                            </div>
                                          ) : (
                                            <span className="text-gray-400">Nicht bewertet</span>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <span className="text-sm text-gray-600">
                                            {new Date(assignment.created_at).toLocaleDateString('de-DE')}
                                          </span>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </CardContent>
                            </Card>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeOverview;
