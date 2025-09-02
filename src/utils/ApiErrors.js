class ApiError extends Error{
    constructor(
        statusCode,
        message = "Somthing went wrong",
        errors = [],
        statck = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.message = message
        this.data = false
        this.success = false
        this.errors = errors
        if(statck){
            this.stack = statck
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}