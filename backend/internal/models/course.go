package models

// Course represents a course record (from Excel upload).
type Course struct {
	CourseCode  string `bson:"course_code" json:"CourseCode"`
	CourseTitle string `bson:"course_title" json:"CourseTitle"`
	Semester    string `bson:"semester" json:"Semester"`
	Credit      string `bson:"credit" json:"Credit"`
}

// ResultDetail represents a single result row (student + course + grade).
type ResultDetail struct {
	RegisterNo string `bson:"register_no" json:"RegisterNo"`
	Name       string `bson:"name" json:"Name"`
	CourseCode string `bson:"course_code" json:"CourseCode"`
	Grade      string `bson:"grade" json:"Grade"`
	ClearedBy  string `bson:"cleared_by" json:"ClearedBy"`
}
