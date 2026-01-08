/**
 * Mock Data for My Layout Design
 * Contains students, events, and comments
 */

const mockData = {
    // TOP 10 STUDENTS
    students: [
        { id: 1, name: "Robert Sarah", avatar: null, score: 95 },
        { id: 2, name: "Zharansia Enlith", avatar: null, score: 92 },
        { id: 3, name: "Marcy Sliman", avatar: null, score: 90 },
        { id: 4, name: "Deniana Conay", avatar: null, score: 88 },
        { id: 5, name: "Maathm Huyhal", avatar: null, score: 87 },
        { id: 6, name: "Maathm Huyhal", avatar: null, score: 85 },
        { id: 7, name: "Jose Perez", avatar: null, score: 84 },
        { id: 8, name: "Maria Perez", avatar: null, score: 82 },
        { id: 9, name: "Sofia Martinez", avatar: null, score: 80 },
        { id: 10, name: "Carmen Hernandez", avatar: null, score: 78 },
        { id: 11, name: "Alex Johnson", avatar: null, score: 76 },
        { id: 12, name: "Patricia Williams", avatar: null, score: 75 },
        { id: 13, name: "Michael Brown", avatar: null, score: 74 },
        { id: 14, name: "Linda Davis", avatar: null, score: 72 },
        { id: 15, name: "James Miller", avatar: null, score: 70 }
    ],

    // UPCOMING EVENTS (Latest 3)
    events: [
        {
            date: "12",
            month: "JAN",
            title: "Project Submission Deadline",
            time: "10:00 AM",
            location: "Online Portal"
        },
        {
            date: "15",
            month: "JAN",
            title: "Guest Lecture: AI in Education",
            time: "2:00 PM",
            location: "Auditorium B"
        },
        {
            date: "20",
            month: "JAN",
            title: "Workshop: Advanced Analytics",
            time: "11:30 AM",
            location: "Lab 3"
        }
    ],

    // LATEST COMMENTS (Last 4)
    comments: [
        {
            text: "Great course content, really enjoyed the module on data visualization!",
            author: "Sarah K.",
            timeAgo: "2 hours ago",
            course: "Data Science 101",
            status: "positive" // green
        },
        {
            text: "I'm having trouble accessing the quiz for Week 4, is there a technical issue?",
            author: "Michael R.",
            timeAgo: "4 hours ago",
            course: "Web Development Fundamentals",
            status: "negative" // red
        },
        {
            text: "The new formatting guidelines are very helpful, thank you!",
            author: "Jennifer L.",
            timeAgo: "6 hours ago",
            course: "Creative Writing Workshop",
            status: "positive"
        },
        {
            text: "Could we get more practice exercises for the probability section?",
            author: "David M.",
            timeAgo: "8 hours ago",
            course: "Statistics Fundamentals",
            status: "positive"
        }
    ]
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = mockData;
}
