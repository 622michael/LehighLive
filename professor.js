const RMP_FUNCTION_ACTION_NAME_TO_FUNCTION = {
    'Test': (req, res) => {
        console.log('Professor method reached');




        res.json({
            fulfillment_text: 'The professor request was successful!'
        });
    }
};
module.exports = RMP_FUNCTION_ACTION_NAME_TO_FUNCTION;